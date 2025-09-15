-- Criar tabela de quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_coins INTEGER NOT NULL DEFAULT 10,
  max_attempts INTEGER DEFAULT 1,
  time_limit_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de perguntas dos quizzes
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, open_text
  options JSONB, -- Para múltipla escolha: ["Opção A", "Opção B", "Opção C", "Opção D"]
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de tentativas de quiz
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  is_completed BOOLEAN NOT NULL DEFAULT false
);

-- Criar tabela de respostas individuais
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quizzes
CREATE POLICY "Todos podem ver quizzes ativos" 
ON public.quizzes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Professores e admins podem gerenciar quizzes" 
ON public.quizzes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Políticas RLS para perguntas
CREATE POLICY "Todos podem ver perguntas de quizzes ativos" 
ON public.quiz_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = quiz_questions.quiz_id 
    AND is_active = true
  )
);

CREATE POLICY "Professores e admins podem gerenciar perguntas" 
ON public.quiz_questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Políticas RLS para tentativas
CREATE POLICY "Usuários podem ver suas próprias tentativas" 
ON public.quiz_attempts 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar suas próprias tentativas" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias tentativas" 
ON public.quiz_attempts 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Professores e admins podem ver todas tentativas" 
ON public.quiz_attempts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Políticas RLS para respostas
CREATE POLICY "Usuários podem ver suas próprias respostas" 
ON public.quiz_answers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts 
    WHERE id = quiz_answers.attempt_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar suas próprias respostas" 
ON public.quiz_answers 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts 
    WHERE id = quiz_answers.attempt_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Professores e admins podem ver todas respostas" 
ON public.quiz_answers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

-- Trigger para atualizar updated_at nos quizzes
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para completar quiz e dar recompensa
CREATE OR REPLACE FUNCTION public.complete_quiz(
  attempt_id UUID,
  user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_attempt_id UUID := complete_quiz.attempt_id;
  v_user_id UUID := complete_quiz.user_id;
  v_quiz_id UUID;
  v_reward_coins INTEGER;
  v_score INTEGER;
  v_total_questions INTEGER;
  v_coins_to_award INTEGER;
  v_passing_score DECIMAL := 0.7; -- 70% para passar
BEGIN
  -- Verificar se o usuário pode completar esta tentativa
  IF auth.uid() IS NULL OR auth.uid() <> v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  -- Buscar dados da tentativa
  SELECT qa.quiz_id, qa.score, qa.total_questions, q.reward_coins
  INTO v_quiz_id, v_score, v_total_questions, v_reward_coins
  FROM public.quiz_attempts qa
  JOIN public.quizzes q ON q.id = qa.quiz_id
  WHERE qa.id = v_attempt_id AND qa.user_id = v_user_id AND qa.is_completed = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tentativa não encontrada ou já finalizada');
  END IF;

  -- Calcular moedas baseado na pontuação (só ganha se passar de 70%)
  IF v_total_questions > 0 AND (v_score::DECIMAL / v_total_questions::DECIMAL) >= v_passing_score THEN
    v_coins_to_award := v_reward_coins;
  ELSE
    v_coins_to_award := 0;
  END IF;

  -- Atualizar a tentativa como completa
  UPDATE public.quiz_attempts
  SET 
    is_completed = true,
    completed_at = now(),
    coins_earned = v_coins_to_award
  WHERE id = v_attempt_id;

  -- Dar moedas ao usuário se passou
  IF v_coins_to_award > 0 THEN
    UPDATE public.profiles
    SET coins = coins + v_coins_to_award,
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'coins_earned', v_coins_to_award,
    'score', v_score,
    'total_questions', v_total_questions,
    'passed', (v_score::DECIMAL / v_total_questions::DECIMAL) >= v_passing_score
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', COALESCE(SQLERRM, 'Erro ao completar quiz'));
END;
$$;