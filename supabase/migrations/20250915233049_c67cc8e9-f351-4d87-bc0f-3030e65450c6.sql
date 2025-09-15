-- Criar função simples para atualizar pontuação do quiz
CREATE OR REPLACE FUNCTION public.update_quiz_score(
  attempt_id UUID,
  points_to_add INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.quiz_attempts
  SET score = score + points_to_add
  WHERE id = attempt_id;
END;
$$;