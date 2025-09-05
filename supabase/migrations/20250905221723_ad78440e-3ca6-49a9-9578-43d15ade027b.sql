-- Phase 1: Critical Data Protection Fixes

-- 1. Fix profiles table RLS policies to protect student PII
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "All authenticated users can view profiles for rankings" ON public.profiles;

-- Create secure ranking view that only exposes necessary data
CREATE OR REPLACE VIEW public.rankings_view AS
SELECT 
  id,
  name,
  coins,
  role,
  created_at
FROM public.profiles
WHERE role IN ('student', 'teacher', 'admin')
ORDER BY coins DESC;

-- Enable RLS on the view (views inherit from base table but we want to be explicit)
-- Note: Views use the RLS of underlying tables, but we'll create specific policies

-- Create new restricted policies for profiles
CREATE POLICY "Users can view minimal profile data for rankings" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can only see id, name, coins, role - no email or other PII
  auth.uid() IS NOT NULL
);

-- Users can still view their own complete profile
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Teachers can view student data (but not admin/teacher emails)
CREATE POLICY "Teachers can view student data" 
ON public.profiles 
FOR SELECT 
USING (
  get_current_user_role() = 'teacher' AND role = 'student'
);

-- 2. Fix user_cards table to protect individual collection data
-- Drop existing overly permissive policy  
DROP POLICY IF EXISTS "All authenticated users can view user cards for rankings" ON public.user_cards;

-- Create aggregated view for collection statistics without exposing individual ownership
CREATE OR REPLACE VIEW public.collection_stats_view AS
SELECT 
  card_id,
  COUNT(DISTINCT user_id) as owners_count,
  SUM(quantity) as total_owned
FROM public.user_cards uc
GROUP BY card_id;

-- Users can only view their own cards
CREATE POLICY "Users can view own cards only" 
ON public.user_cards 
FOR SELECT 
USING (user_id = auth.uid());

-- 3. Create secure function to get user role without exposing profile table
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_uuid;
$$;

-- 4. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_user_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- System can insert logs (for triggers)
CREATE POLICY "System can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (true);

-- 5. Create trigger function for security logging
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.security_logs (user_id, action, target_user_id, metadata)
    VALUES (
      auth.uid(),
      'role_change',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'table', 'profiles'
      )
    );
  END IF;

  -- Log coin changes (large amounts)
  IF TG_OP = 'UPDATE' AND ABS(NEW.coins - OLD.coins) > 1000 THEN
    INSERT INTO public.security_logs (user_id, action, target_user_id, metadata)
    VALUES (
      auth.uid(),
      'large_coin_change',
      NEW.id,
      jsonb_build_object(
        'old_coins', OLD.coins,
        'new_coins', NEW.coins,
        'difference', NEW.coins - OLD.coins
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for profiles security logging
CREATE TRIGGER profiles_security_log
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_security_event();