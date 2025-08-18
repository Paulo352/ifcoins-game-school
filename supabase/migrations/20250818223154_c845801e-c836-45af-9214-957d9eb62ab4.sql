-- Update RLS policies to allow students to view other students' rankings data
-- Add policy for students to view other students' basic profile info for rankings
CREATE POLICY "Students can view other students for rankings" 
ON public.profiles 
FOR SELECT 
USING (role = 'student'::user_role AND get_current_user_role() = 'student');

-- Also allow students to view user_cards data for card rankings
CREATE POLICY "Students can view other students' cards for rankings" 
ON public.user_cards 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE public.profiles.id = user_cards.user_id 
  AND public.profiles.role = 'student'::user_role
  AND get_current_user_role() = 'student'
));