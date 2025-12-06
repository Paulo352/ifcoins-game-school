-- Adicionar role 'intruso' ao enum app_role e user_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intruso';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'intruso';

-- Atualizar função handle_new_user para tratar "intruso"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_text text;
    allowed_gmail text := 'paulocauan39@gmail.com';
BEGIN
    -- Determine the role based on email
    IF NEW.email LIKE '%@estudantes.ifpr.edu.br' THEN
        user_role_text := 'student';
    ELSIF NEW.email LIKE '%@ifpr.edu.br' THEN
        user_role_text := 'teacher';
    ELSIF is_admin_email(NEW.email) THEN
        user_role_text := 'admin';
    ELSIF NEW.email = allowed_gmail THEN
        user_role_text := 'student';
    ELSE
        -- Qualquer outro domínio é classificado como intruso
        user_role_text := 'intruso';
    END IF;

    -- Insert the profile
    INSERT INTO public.profiles (id, name, email, role, coins)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        user_role_text::user_role,
        CASE WHEN user_role_text = 'intruso' THEN 0 ELSE 100 END
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