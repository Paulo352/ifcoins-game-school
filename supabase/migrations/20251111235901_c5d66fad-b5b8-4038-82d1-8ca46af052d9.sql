-- Criar tabela de mentorias
CREATE TABLE IF NOT EXISTS public.mentorships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  mentor_notes TEXT,
  mentee_feedback TEXT,
  CONSTRAINT mentorships_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT mentorships_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT different_users CHECK (mentor_id != mentee_id)
);

-- Criar tabela de atividades de mentoria
CREATE TABLE IF NOT EXISTS public.mentorship_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- session, help, quiz_support, study_session
  description TEXT NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_activities_mentorship_id_fkey FOREIGN KEY (mentorship_id) REFERENCES mentorships(id) ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX idx_mentorships_mentor_id ON public.mentorships(mentor_id);
CREATE INDEX idx_mentorships_mentee_id ON public.mentorships(mentee_id);
CREATE INDEX idx_mentorships_status ON public.mentorships(status);
CREATE INDEX idx_mentorship_activities_mentorship_id ON public.mentorship_activities(mentorship_id);

-- Enable RLS
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para mentorships
CREATE POLICY "Usuários podem ver suas mentorias"
  ON public.mentorships
  FOR SELECT
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "Alunos podem solicitar mentoria"
  ON public.mentorships
  FOR INSERT
  WITH CHECK (mentee_id = auth.uid());

CREATE POLICY "Mentores e mentorados podem atualizar"
  ON public.mentorships
  FOR UPDATE
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "Admins podem ver todas mentorias"
  ON public.mentorships
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para mentorship_activities
CREATE POLICY "Participantes podem ver atividades"
  ON public.mentorship_activities
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mentorships
    WHERE mentorships.id = mentorship_activities.mentorship_id
    AND (mentorships.mentor_id = auth.uid() OR mentorships.mentee_id = auth.uid())
  ));

CREATE POLICY "Mentores podem criar atividades"
  ON public.mentorship_activities
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mentorships
    WHERE mentorships.id = mentorship_activities.mentorship_id
    AND mentorships.mentor_id = auth.uid()
  ));

CREATE POLICY "Admins podem ver todas atividades"
  ON public.mentorship_activities
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para recompensar mentor após atividade
CREATE OR REPLACE FUNCTION reward_mentor_for_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar moedas do mentor
  UPDATE profiles
  SET coins = coins + NEW.coins_earned
  WHERE id = (SELECT mentor_id FROM mentorships WHERE id = NEW.mentorship_id);
  
  -- Criar log de recompensa
  INSERT INTO reward_logs (student_id, coins, reason, teacher_id)
  VALUES (
    (SELECT mentor_id FROM mentorships WHERE id = NEW.mentorship_id),
    NEW.coins_earned,
    'Atividade de mentoria: ' || NEW.activity_type,
    (SELECT mentor_id FROM mentorships WHERE id = NEW.mentorship_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para recompensar mentor
CREATE TRIGGER trigger_reward_mentor_for_activity
AFTER INSERT ON public.mentorship_activities
FOR EACH ROW
WHEN (NEW.coins_earned > 0)
EXECUTE FUNCTION reward_mentor_for_activity();