-- Security Fix: Create secure role-based access policies

-- Create a security definer function to get current user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- Drop problematic policies and recreate them securely
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies for profiles access
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

-- Update the user creation function to use text instead of enum directly
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    user_role_text text;
BEGIN
    -- Determinar o role baseado no email
    IF NEW.email LIKE '%@estudantes.ifpr.edu.br' THEN
        user_role_text := 'student';
    ELSIF NEW.email LIKE '%@ifpr.edu.br' THEN
        user_role_text := 'teacher';
    ELSIF NEW.email = 'paulocauan39@gmail.com' THEN
        user_role_text := 'admin';
    ELSE
        user_role_text := 'student';
    END IF;

    -- Inserir o perfil
    INSERT INTO public.profiles (id, name, email, role, coins)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        user_role_text::user_role,
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