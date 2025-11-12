-- Fix infinite recursion in cards RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view cards they own or available cards" ON cards;

-- Create a security definer function to check if user owns a card
CREATE OR REPLACE FUNCTION public.user_owns_card(_card_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_cards
    WHERE card_id = _card_id
    AND user_id = _user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view cards they own or available cards"
ON cards
FOR SELECT
USING (
  -- Cards that are available and not special
  ((available = true) AND ((is_special = false) OR (is_special IS NULL)))
  OR
  -- Cards that the user owns (using security definer function)
  public.user_owns_card(id, auth.uid())
);