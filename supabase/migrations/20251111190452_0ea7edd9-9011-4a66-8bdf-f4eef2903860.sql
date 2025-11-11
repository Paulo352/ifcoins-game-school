-- Fix 1: Remove overly permissive student rankings policy that exposes PII
DROP POLICY IF EXISTS "Students can view rankings" ON public.profiles;

-- Create a more restrictive policy that only allows students to see their own full profile
-- Other students' profiles should only be accessible via the rankings_secure view
CREATE POLICY "Students can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'teacher'::app_role)
);

-- Fix 2: Ensure rankings_secure view exists and is properly secured
DROP VIEW IF EXISTS public.rankings_secure CASCADE;

CREATE VIEW public.rankings_secure AS
SELECT 
  id,
  name,
  coins,
  created_at
FROM public.profiles
WHERE role = 'student'::user_role;

-- Grant access to authenticated users
GRANT SELECT ON public.rankings_secure TO authenticated;

-- RLS policies for rankings_secure view
ALTER VIEW public.rankings_secure SET (security_invoker = true);

-- Fix 3: Update rankings_view to use security invoker instead of security definer
DROP VIEW IF EXISTS public.rankings_view CASCADE;

CREATE VIEW public.rankings_view AS
SELECT 
  id,
  name,
  coins,
  created_at
FROM public.profiles
WHERE role = 'student'::user_role
ORDER BY coins DESC;

-- Use security invoker to respect RLS of the calling user
ALTER VIEW public.rankings_view SET (security_invoker = true);

-- Grant access
GRANT SELECT ON public.rankings_view TO authenticated;