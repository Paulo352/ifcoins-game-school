-- ============================================
-- CRITICAL SECURITY FIX: Separate Roles Table
-- ============================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CRITICAL SECURITY FIX: Student Data Exposure
-- ============================================

-- 6. Create secure rankings view (no sensitive data)
CREATE OR REPLACE VIEW public.rankings_secure AS
SELECT 
  id,
  name,
  coins,
  created_at
FROM public.profiles
WHERE role = 'student'::user_role;

-- Grant access to authenticated users
GRANT SELECT ON public.rankings_secure TO authenticated;

-- 7. Drop overly permissive RLS policy
DROP POLICY IF EXISTS "Users can view minimal profile data for rankings" ON public.profiles;

-- 8. Update get_current_user_role function to use user_roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- 9. Update get_user_role_secure to use user_roles
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid UUID)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
  LIMIT 1
$$;

-- 10. Update handle_new_user trigger to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_text text;
BEGIN
    -- Determine the role based on email
    IF NEW.email LIKE '%@estudantes.ifpr.edu.br' THEN
        user_role_text := 'student';
    ELSIF NEW.email LIKE '%@ifpr.edu.br' THEN
        user_role_text := 'teacher';
    ELSIF is_admin_email(NEW.email) THEN
        user_role_text := 'admin';
    ELSE
        user_role_text := 'student';
    END IF;

    -- Insert the profile (keep role column for backwards compatibility during migration)
    INSERT INTO public.profiles (id, name, email, role, coins)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        user_role_text::user_role,
        100
    );
    
    -- Insert into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role_text::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log user creation
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
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 11. Update update_user_role_secure to use user_roles
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id UUID, 
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
  -- Check if current user is admin using new function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Get current role and email of target user
  SELECT role, email INTO old_role, target_user_email
  FROM public.profiles 
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Prevent removing admin role from configured admin email
  IF old_role = 'admin' AND new_role != 'admin' AND is_admin_email(target_user_email) THEN
    RAISE EXCEPTION 'Cannot remove admin role from configured admin email';
  END IF;

  -- Update user_roles table (delete old, insert new)
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role::text::app_role);
  
  -- Update profiles table for backwards compatibility
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  -- Log the change
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