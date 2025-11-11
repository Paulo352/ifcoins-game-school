-- Fix: Prevent students from viewing special/exclusive cards in trading system
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Students can view other students cards for trading" ON public.user_cards;

-- Create a new restricted policy that excludes special cards
CREATE POLICY "Students can view other students cards for trading"
ON public.user_cards
FOR SELECT
TO authenticated
USING (
  -- Allow students to view other students' cards, but NOT special cards
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid() 
      AND profiles.role = 'student'::user_role
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = user_cards.user_id 
      AND profiles.role = 'student'::user_role
  )
  AND EXISTS (
    SELECT 1
    FROM public.cards
    WHERE cards.id = user_cards.card_id
      AND (cards.is_special = false OR cards.is_special IS NULL)
  )
);