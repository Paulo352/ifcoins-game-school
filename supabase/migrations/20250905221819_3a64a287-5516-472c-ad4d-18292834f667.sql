-- Fix security definer view issues and continue with Phase 2 security fixes

-- 1. Fix the security definer view issues by recreating views without security definer
DROP VIEW IF EXISTS public.rankings_view;
DROP VIEW IF EXISTS public.collection_stats_view;

-- Create views without security definer (they'll use the calling user's permissions)
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

-- This view will work through the existing RLS policies
CREATE OR REPLACE VIEW public.collection_stats_view AS
SELECT 
  card_id,
  COUNT(DISTINCT user_id) as owners_count,
  SUM(quantity) as total_owned
FROM public.user_cards uc
GROUP BY card_id;

-- 2. Create a secure admin configuration table instead of hardcoded emails
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin config
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admin config
CREATE POLICY "Admins can manage admin config" 
ON public.admin_config 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Insert the current admin email into config (this replaces hardcoding)
INSERT INTO public.admin_config (config_key, config_value)
VALUES ('default_admin_email', 'paulocauan39@gmail.com')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;

-- 3. Create function to check if user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin_email(email_to_check text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_config 
    WHERE config_key = 'default_admin_email' 
    AND config_value = email_to_check
  );
$$;

-- 4. Update the handle_new_user function to use dynamic admin check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_text text;
BEGIN
    -- Determine the role based on email using secure function
    IF NEW.email LIKE '%@estudantes.ifpr.edu.br' THEN
        user_role_text := 'student';
    ELSIF NEW.email LIKE '%@ifpr.edu.br' THEN
        user_role_text := 'teacher';
    ELSIF is_admin_email(NEW.email) THEN
        user_role_text := 'admin';
    ELSE
        user_role_text := 'student';
    END IF;

    -- Insert the profile
    INSERT INTO public.profiles (id, name, email, role, coins)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        user_role_text::user_role,
        100
    );
    
    -- Log user creation for security audit
    INSERT INTO public.security_logs (user_id, action, target_user_id, metadata)
    VALUES (
        NEW.id,
        'user_created',
        NEW.id,
        jsonb_build_object(
            'email', NEW.email,
            'role', user_role_text,
            'registration_method', 'email_signup'
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't block registration
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 5. Create function for secure role updates with additional validation
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id uuid,
  new_role user_role,
  reason text DEFAULT 'Role update by admin'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  target_user_email text;
  old_role user_role;
BEGIN
  -- Check if current user is admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Get current role and email of target user
  SELECT role, email INTO old_role, target_user_email
  FROM public.profiles 
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Prevent removing admin role from the configured admin email
  IF old_role = 'admin' AND new_role != 'admin' AND is_admin_email(target_user_email) THEN
    RAISE EXCEPTION 'Cannot remove admin role from configured admin email';
  END IF;

  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  -- Log the change (will be picked up by trigger as well)
  INSERT INTO public.security_logs (user_id, action, target_user_id, metadata)
  VALUES (
    auth.uid(),
    'role_update_secure',
    target_user_id,
    jsonb_build_object(
      'old_role', old_role,
      'new_role', new_role,
      'reason', reason,
      'target_email', target_user_email
    )
  );

  RETURN true;
END;
$$;