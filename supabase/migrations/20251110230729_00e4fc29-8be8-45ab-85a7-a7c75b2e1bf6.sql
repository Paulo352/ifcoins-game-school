
-- Corrigir a função complete_quiz para garantir que is_completed seja atualizado
CREATE OR REPLACE FUNCTION public.complete_quiz(attempt_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_quiz_id UUID;
  v_reward_coins INTEGER;
  v_reward_type TEXT;
  v_reward_card_id UUID;
  v_score INTEGER;
  v_correct_answers INTEGER;
  v_total_questions INTEGER;
  v_coins_to_award INTEGER;
  v_passing_score DECIMAL := 0.7;
  v_percentage DECIMAL;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  -- Buscar dados da tentativa com COALESCE para evitar NULL
  SELECT 
    qa.quiz_id, 
    COALESCE(qa.score, 0), 
    COALESCE(qa.correct_answers, 0), 
    COALESCE(qa.total_questions, 0),
    q.reward_coins, 
    q.reward_type, 
    q.reward_card_id
  INTO v_quiz_id, v_score, v_correct_answers, v_total_questions, v_reward_coins, v_reward_type, v_reward_card_id
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.id = attempt_id AND qa.user_id = user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tentativa não encontrada');
  END IF;

  -- Calcular porcentagem
  IF v_total_questions > 0 THEN
    v_percentage := v_correct_answers::DECIMAL / v_total_questions::DECIMAL;
  ELSE
    v_percentage := 0;
  END IF;

  -- Verificar se passou
  v_coins_to_award := 0;
  IF v_percentage >= v_passing_score THEN
    IF v_reward_type = 'card' AND v_reward_card_id IS NOT NULL THEN
      -- Dar carta
      INSERT INTO user_cards (user_id, card_id, quantity)
      VALUES (user_id, v_reward_card_id, 1)
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET quantity = user_cards.quantity + 1;
    ELSE
      -- Dar moedas
      v_coins_to_award := v_reward_coins;
      UPDATE profiles
      SET coins = coins + v_coins_to_award,
          updated_at = now()
      WHERE id = user_id;
    END IF;
  END IF;

  -- Atualizar tentativa com is_completed = true
  UPDATE quiz_attempts
  SET is_completed = true,
      completed_at = now(),
      coins_earned = v_coins_to_award,
      score = v_score,
      correct_answers = v_correct_answers
  WHERE id = attempt_id;

  RETURN json_build_object(
    'success', true,
    'coins_earned', v_coins_to_award,
    'card_rewarded', v_reward_type = 'card' AND v_reward_card_id IS NOT NULL,
    'score', v_score,
    'correct_answers', v_correct_answers,
    'total_questions', v_total_questions,
    'percentage', ROUND(v_percentage * 100, 2),
    'passed', v_percentage >= v_passing_score
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', COALESCE(SQLERRM, 'Erro ao completar quiz'));
END;
$function$;

-- Criar tabela de badges/conquistas
CREATE TABLE IF NOT EXISTS public.quiz_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'quizzes_completed', 'correct_streak', 'perfect_score', 'total_points'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de badges dos usuários
CREATE TABLE IF NOT EXISTS public.user_quiz_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES quiz_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_quiz_badges_user_id ON user_quiz_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_badges_badge_id ON user_quiz_badges(badge_id);

-- Habilitar RLS
ALTER TABLE quiz_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_badges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quiz_badges
CREATE POLICY "Todos podem ver badges" ON quiz_badges FOR SELECT USING (true);
CREATE POLICY "Admins podem gerenciar badges" ON quiz_badges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para user_quiz_badges
CREATE POLICY "Usuários podem ver seus badges" ON user_quiz_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins podem ver todos badges" ON user_quiz_badges FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Sistema pode inserir badges" ON user_quiz_badges FOR INSERT WITH CHECK (true);

-- Inserir badges padrão
INSERT INTO quiz_badges (name, description, icon, requirement_type, requirement_value) VALUES
('Primeiro Quiz', 'Complete seu primeiro quiz', '🎓', 'quizzes_completed', 1),
('Estudante Dedicado', 'Complete 5 quizzes', '📚', 'quizzes_completed', 5),
('Mestre dos Quizzes', 'Complete 10 quizzes', '🏆', 'quizzes_completed', 10),
('Perfeição', 'Acerte 100% em um quiz', '⭐', 'perfect_score', 1),
('Sequência de 3', 'Acerte 3 questões seguidas', '🔥', 'correct_streak', 3),
('Sequência de 5', 'Acerte 5 questões seguidas', '💥', 'correct_streak', 5),
('100 Pontos', 'Acumule 100 pontos em quizzes', '💯', 'total_points', 100),
('500 Pontos', 'Acumule 500 pontos em quizzes', '🌟', 'total_points', 500)
ON CONFLICT DO NOTHING;

-- Função para verificar e conceder badges automaticamente
CREATE OR REPLACE FUNCTION check_and_award_quiz_badges(p_user_id UUID, p_attempt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_quizzes_completed INTEGER;
  v_total_points INTEGER;
  v_correct_answers INTEGER;
  v_total_questions INTEGER;
  v_badge RECORD;
BEGIN
  -- Contar quizzes completados
  SELECT COUNT(*) INTO v_quizzes_completed
  FROM quiz_attempts
  WHERE user_id = p_user_id AND is_completed = true;

  -- Somar pontos totais
  SELECT COALESCE(SUM(score), 0) INTO v_total_points
  FROM quiz_attempts
  WHERE user_id = p_user_id AND is_completed = true;

  -- Verificar se teve score perfeito
  SELECT correct_answers, total_questions INTO v_correct_answers, v_total_questions
  FROM quiz_attempts
  WHERE id = p_attempt_id;

  -- Verificar badges de quizzes completados
  FOR v_badge IN 
    SELECT * FROM quiz_badges 
    WHERE requirement_type = 'quizzes_completed' 
    AND requirement_value <= v_quizzes_completed
  LOOP
    INSERT INTO user_quiz_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  -- Verificar badges de pontos totais
  FOR v_badge IN 
    SELECT * FROM quiz_badges 
    WHERE requirement_type = 'total_points' 
    AND requirement_value <= v_total_points
  LOOP
    INSERT INTO user_quiz_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;

  -- Verificar badge de score perfeito
  IF v_correct_answers = v_total_questions AND v_total_questions > 0 THEN
    INSERT INTO user_quiz_badges (user_id, badge_id)
    SELECT p_user_id, id FROM quiz_badges 
    WHERE requirement_type = 'perfect_score'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
END;
$function$;
