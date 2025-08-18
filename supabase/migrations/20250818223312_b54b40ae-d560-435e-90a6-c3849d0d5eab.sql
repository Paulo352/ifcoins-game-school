-- Fix RLS policies to allow proper rankings functionality
-- Drop the restrictive policies and create better ones
DROP POLICY IF EXISTS "Students can view other students for rankings" ON public.profiles;
DROP POLICY IF EXISTS "Students can view other students' cards for rankings" ON public.user_cards;

-- Allow all authenticated users to view basic profile data for rankings (name, coins, role)
CREATE POLICY "All authenticated users can view profiles for rankings" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to view user_cards for rankings
CREATE POLICY "All authenticated users can view user cards for rankings" 
ON public.user_cards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);