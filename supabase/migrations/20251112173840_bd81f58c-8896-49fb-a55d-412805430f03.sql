
-- Fix RLS policy: Users should see cards they own even if unavailable

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view normal available cards" ON cards;

-- Create new policy that allows users to see cards they own
CREATE POLICY "Users can view cards they own or available cards"
ON cards
FOR SELECT
USING (
  -- Cards that are available and not special
  ((available = true) AND ((is_special = false) OR (is_special IS NULL)))
  OR
  -- Cards that the user owns (via user_cards table)
  (EXISTS (
    SELECT 1 FROM user_cards
    WHERE user_cards.card_id = cards.id
    AND user_cards.user_id = auth.uid()
  ))
);
