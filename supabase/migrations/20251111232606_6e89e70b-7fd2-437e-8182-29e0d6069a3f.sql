-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Admins e professores podem criar turmas"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);

CREATE POLICY "Admins e professores podem ver turmas"
ON public.classes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role) OR
  teacher_id = auth.uid()
);

CREATE POLICY "Criadores podem atualizar suas turmas"
ON public.classes
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar turmas"
ON public.classes
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create class_students junction table
CREATE TABLE IF NOT EXISTS public.class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Enable RLS
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_students
CREATE POLICY "Admins e professores podem adicionar alunos"
ON public.class_students
FOR INSERT
TO authenticated
WITH CHECK (
  added_by = auth.uid() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);

CREATE POLICY "Admins e professores podem ver alunos das turmas"
ON public.class_students
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role) OR
  student_id = auth.uid()
);

CREATE POLICY "Admins podem remover alunos"
ON public.class_students
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add badge levels to quiz_badges
ALTER TABLE public.quiz_badges
ADD COLUMN IF NOT EXISTS badge_level text DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
ADD COLUMN IF NOT EXISTS next_level_requirement integer;

-- Add badge levels to custom_badges  
ALTER TABLE public.custom_badges
ADD COLUMN IF NOT EXISTS badge_level text DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum'));

-- Create badge progress tracking table
CREATE TABLE IF NOT EXISTS public.user_badge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.quiz_badges(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0,
  current_level text DEFAULT 'bronze' CHECK (current_level IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu progresso"
ON public.user_badge_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Sistema pode atualizar progresso"
ON public.user_badge_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Create real-time notifications table for achievements
CREATE TABLE IF NOT EXISTS public.achievement_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('badge_earned', 'rank_achieved', 'level_up', 'match_won')),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievement_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notificações"
ON public.achievement_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas notificações"
ON public.achievement_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar notificações"
ON public.achievement_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for achievement_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievement_notifications;

-- Function to create achievement notification
CREATE OR REPLACE FUNCTION public.create_achievement_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO achievement_notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;