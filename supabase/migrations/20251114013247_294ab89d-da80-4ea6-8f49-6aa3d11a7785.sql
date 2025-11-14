-- Fix RLS recursion between cards and user_cards and restore visibility for shop, collection and trade selector
-- 1) Remove user_cards policy that references cards (causing circular dependency)
DROP POLICY IF EXISTS "Students can view other students normal cards only" ON public.user_cards;

-- 2) Replace cards policy that used a function (possible hidden recursion) with a direct EXISTS to user_cards
DROP POLICY IF EXISTS "Users can view cards they own or available cards" ON public.cards;
CREATE POLICY "Users can view cards they own or available cards"
ON public.cards
FOR SELECT
USING (
  -- allow available, non-special cards to everyone
  ((available = true) AND (COALESCE(is_special, false) = false))
  OR
  -- allow users to see cards they own (via user_cards)
  EXISTS (
    SELECT 1 FROM public.user_cards uc
    WHERE uc.card_id = cards.id AND uc.user_id = auth.uid()
  )
);

-- 3) Recreate the student-to-student visibility on cards without causing recursion
--    (cards references user_cards, but user_cards no longer references cards)
DROP POLICY IF EXISTS "Students can view cards owned by other students" ON public.cards;
CREATE POLICY "Students can view other students normal cards"
ON public.cards
FOR SELECT
USING (
  COALESCE(is_special, false) = false
  AND EXISTS (
    SELECT 1 FROM public.user_cards uc
    WHERE uc.card_id = cards.id AND uc.user_id <> auth.uid()
  )
);

-- 4) Ensure students can list other students' user_cards rows without referencing cards
--    (there is already a permissive policy "Students can view other students cards". Keep it.)
--    If it does not exist, uncomment the block below.
-- CREATE POLICY "Students can view other students user_cards"
-- ON public.user_cards
-- FOR SELECT
-- USING (
--   has_role(auth.uid(), 'student'::app_role)
-- );

-- Notes:
-- - We intentionally removed any reference from user_cards policies to the cards table to break the cycle.
-- - We replaced function user_owns_card(...) in cards policy with a direct EXISTS to avoid hidden recursion.
-- - Special/exclusive cards remain hidden unless the viewer owns them (or is admin).
