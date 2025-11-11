-- Create user ranks/titles system
CREATE TABLE IF NOT EXISTS public.user_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_rank text NOT NULL DEFAULT 'iniciante' CHECK (current_rank IN ('iniciante', 'intermediario', 'avancado', 'mestre', 'lenda')),
  total_points integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  badges_earned integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  rank_updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver ranks"
ON public.user_ranks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode gerenciar ranks"
ON public.user_ranks
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Create rank thresholds table
CREATE TABLE IF NOT EXISTS public.rank_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name text NOT NULL UNIQUE CHECK (rank_name IN ('iniciante', 'intermediario', 'avancado', 'mestre', 'lenda')),
  min_points integer NOT NULL,
  min_quizzes integer NOT NULL,
  min_badges integer NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rank_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver thresholds"
ON public.rank_thresholds
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins podem gerenciar thresholds"
ON public.rank_thresholds
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default rank thresholds
INSERT INTO public.rank_thresholds (rank_name, min_points, min_quizzes, min_badges, icon, color) VALUES
  ('iniciante', 0, 0, 0, '🌱', '#10b981'),
  ('intermediario', 500, 10, 5, '⭐', '#3b82f6'),
  ('avancado', 1500, 30, 15, '💎', '#8b5cf6'),
  ('mestre', 3000, 60, 30, '👑', '#f59e0b'),
  ('lenda', 5000, 100, 50, '🏆', '#ef4444')
ON CONFLICT (rank_name) DO NOTHING;

-- Function to calculate and update user rank
CREATE OR REPLACE FUNCTION public.update_user_rank(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points integer;
  v_quizzes_completed integer;
  v_badges_earned integer;
  v_new_rank text;
  v_old_rank text;
BEGIN
  -- Calculate stats
  SELECT COALESCE(SUM(score), 0), COUNT(*)
  INTO v_total_points, v_quizzes_completed
  FROM quiz_attempts
  WHERE user_id = p_user_id AND is_completed = true;

  SELECT COUNT(*)
  INTO v_badges_earned
  FROM user_quiz_badges
  WHERE user_id = p_user_id;

  -- Get current rank
  SELECT current_rank INTO v_old_rank
  FROM user_ranks
  WHERE user_id = p_user_id;

  -- Determine new rank
  SELECT rank_name INTO v_new_rank
  FROM rank_thresholds
  WHERE min_points <= v_total_points
    AND min_quizzes <= v_quizzes_completed
    AND min_badges <= v_badges_earned
  ORDER BY min_points DESC
  LIMIT 1;

  IF v_new_rank IS NULL THEN
    v_new_rank := 'iniciante';
  END IF;

  -- Upsert user rank
  INSERT INTO user_ranks (user_id, current_rank, total_points, quizzes_completed, badges_earned, rank_updated_at)
  VALUES (p_user_id, v_new_rank, v_total_points, v_quizzes_completed, v_badges_earned, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_rank = v_new_rank,
    total_points = v_total_points,
    quizzes_completed = v_quizzes_completed,
    badges_earned = v_badges_earned,
    rank_updated_at = CASE WHEN user_ranks.current_rank != v_new_rank THEN now() ELSE user_ranks.rank_updated_at END;

  -- Create notification if rank changed
  IF v_old_rank IS NOT NULL AND v_old_rank != v_new_rank THEN
    PERFORM create_achievement_notification(
      p_user_id,
      'level_up',
      'Novo Título Conquistado!',
      format('Você subiu de %s para %s!', v_old_rank, v_new_rank),
      jsonb_build_object('old_rank', v_old_rank, 'new_rank', v_new_rank)
    );
  END IF;

  RETURN v_new_rank;
END;
$$;

-- Add multiple teachers support to classes
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS additional_teachers uuid[] DEFAULT '{}';

-- Update trigger to auto-update ranks after quiz completion
CREATE OR REPLACE FUNCTION public.trigger_update_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    PERFORM update_user_rank(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_update_rank ON public.quiz_attempts;
CREATE TRIGGER auto_update_rank
AFTER UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION trigger_update_rank();