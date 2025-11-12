-- Criar tabela de avaliações de mentoria
CREATE TABLE IF NOT EXISTS public.mentorship_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_reviews_mentorship_id_fkey FOREIGN KEY (mentorship_id) REFERENCES mentorships(id) ON DELETE CASCADE,
  CONSTRAINT mentorship_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT one_review_per_mentorship UNIQUE (mentorship_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE public.mentorship_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Participantes podem ver avaliações"
  ON public.mentorship_reviews
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mentorships
    WHERE mentorships.id = mentorship_reviews.mentorship_id
    AND (mentorships.mentor_id = auth.uid() OR mentorships.mentee_id = auth.uid())
  ));

CREATE POLICY "Mentorados podem criar avaliações"
  ON public.mentorship_reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM mentorships
      WHERE mentorships.id = mentorship_reviews.mentorship_id
      AND mentorships.mentee_id = auth.uid()
      AND mentorships.status = 'completed'
    )
  );

CREATE POLICY "Admins podem ver todas avaliações"
  ON public.mentorship_reviews
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar índice
CREATE INDEX idx_mentorship_reviews_mentorship_id ON public.mentorship_reviews(mentorship_id);
CREATE INDEX idx_mentorship_reviews_rating ON public.mentorship_reviews(rating);