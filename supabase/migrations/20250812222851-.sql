-- Security Fix: Remove all existing policies and create secure role-based access

-- Drop all existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a security definer function to get current user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Create secure policies for profiles access
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Teachers can view student profiles (limited)" 
ON public.profiles 
FOR SELECT 
USING (
  public.get_current_user_role() = 'teacher' 
  AND role = 'student'
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Recreate necessary policies for other operations
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Update existing database functions to use secure search_path
CREATE OR REPLACE FUNCTION public.update_user_coins(user_id uuid, amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    UPDATE public.profiles 
    SET coins = coins + amount,
        updated_at = now()
    WHERE id = user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    user_role_value public.user_role;
BEGIN
    -- Determinar o role baseado no email
    IF NEW.email LIKE '%@estudantes.ifpr.edu.br' THEN
        user_role_value := 'student'::public.user_role;
    ELSIF NEW.email LIKE '%@ifpr.edu.br' THEN
        user_role_value := 'teacher'::public.user_role;
    ELSIF NEW.email = 'paulocauan39@gmail.com' THEN
        user_role_value := 'admin'::public.user_role;
    ELSE
        user_role_value := 'student'::public.user_role;
    END IF;

    -- Inserir o perfil
    INSERT INTO public.profiles (id, name, email, role, coins)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        user_role_value,
        100
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não bloquear o cadastro
        RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$;