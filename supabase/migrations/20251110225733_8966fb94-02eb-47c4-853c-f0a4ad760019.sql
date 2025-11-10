-- Fix quiz scoring to count correct answers instead of points

-- Add column to track correct answers count
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS correct_answers INTEGER NOT NULL DEFAULT 0;

-- Update trigger function to count correct answers separately
CREATE OR REPLACE FUNCTION public.update_quiz_attempt_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update both score (points) and correct_answers count
  UPDATE quiz_attempts
  SET score = COALESCE(score, 0) + COALESCE(NEW.points_earned, 0),
      correct_answers = COALESCE(correct_answers, 0) + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
  WHERE id = NEW.attempt_id;
  
  RETURN NEW;
END;
$$;

-- Update complete_quiz to use correct_answers for percentage calculation
CREATE OR REPLACE FUNCTION public.complete_quiz(attempt_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  SELECT qa.quiz_id, COALESCE(qa.score, 0), COALESCE(qa.correct_answers, 0), COALESCE(qa.total_questions, 0), q.reward_coins, q.reward_type, q.reward_card_id
  INTO v_quiz_id, v_score, v_correct_answers, v_total_questions, v_reward_coins, v_reward_type, v_reward_card_id
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.id = attempt_id AND qa.user_id = user_id AND qa.is_completed = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tentativa não encontrada ou já finalizada');
  END IF;

  -- Calculate percentage based on correct answers (handle division by zero)
  IF v_total_questions > 0 THEN
    v_percentage := v_correct_answers::DECIMAL / v_total_questions::DECIMAL;
  ELSE
    v_percentage := 0;
  END IF;

  -- Check if passed
  IF v_percentage >= v_passing_score THEN
    -- Give reward based on type
    IF v_reward_type = 'card' AND v_reward_card_id IS NOT NULL THEN
      -- Give card
      INSERT INTO user_cards (user_id, card_id, quantity)
      VALUES (user_id, v_reward_card_id, 1)
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET quantity = user_cards.quantity + 1;
      
      v_coins_to_award := 0;
    ELSE
      -- Give coins
      v_coins_to_award := v_reward_coins;
      UPDATE profiles
      SET coins = coins + v_coins_to_award,
          updated_at = now()
      WHERE id = user_id;
    END IF;
  ELSE
    v_coins_to_award := 0;
  END IF;

  -- Update attempt
  UPDATE quiz_attempts
  SET is_completed = true,
      completed_at = now(),
      coins_earned = v_coins_to_award
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
$$;