-- Corrigir a função complete_quiz para contar respostas corretas diretamente
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
  v_practice_mode BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  -- Buscar dados da tentativa
  SELECT 
    qa.quiz_id, 
    COALESCE(qa.score, 0), 
    COALESCE(qa.total_questions, 0),
    COALESCE(qa.practice_mode, false),
    q.reward_coins, 
    q.reward_type, 
    q.reward_card_id
  INTO v_quiz_id, v_score, v_total_questions, v_practice_mode, v_reward_coins, v_reward_type, v_reward_card_id
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.id = attempt_id AND qa.user_id = user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tentativa não encontrada');
  END IF;

  -- CORRIGIDO: Contar respostas corretas DIRETAMENTE da tabela quiz_answers
  SELECT COUNT(*)
  INTO v_correct_answers
  FROM quiz_answers
  WHERE attempt_id = complete_quiz.attempt_id AND is_correct = true;

  -- Calcular porcentagem
  IF v_total_questions > 0 THEN
    v_percentage := v_correct_answers::DECIMAL / v_total_questions::DECIMAL;
  ELSE
    v_percentage := 0;
  END IF;

  -- Verificar se passou e não é modo prática
  v_coins_to_award := 0;
  IF v_percentage >= v_passing_score AND NOT v_practice_mode THEN
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

  -- Atualizar tentativa com os valores CORRETOS
  UPDATE quiz_attempts
  SET is_completed = true,
      completed_at = now(),
      coins_earned = v_coins_to_award,
      score = v_score,
      correct_answers = v_correct_answers  -- ATUALIZAR com o valor correto
  WHERE id = attempt_id;

  -- Verificar badges apenas se não for modo prática
  IF NOT v_practice_mode THEN
    PERFORM check_and_award_quiz_badges(user_id, attempt_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'coins_earned', v_coins_to_award,
    'card_rewarded', v_reward_type = 'card' AND v_reward_card_id IS NOT NULL,
    'score', v_score,
    'correct_answers', v_correct_answers,
    'total_questions', v_total_questions,
    'percentage', ROUND(v_percentage * 100, 2),
    'passed', v_percentage >= v_passing_score,
    'practice_mode', v_practice_mode
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', COALESCE(SQLERRM, 'Erro ao completar quiz'));
END;
$function$;