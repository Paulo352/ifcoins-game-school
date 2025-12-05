-- Create junction table for quiz-class relationships (multiple classes per quiz)
CREATE TABLE IF NOT EXISTS public.quiz_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, class_id)
);

-- Enable RLS
ALTER TABLE public.quiz_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view quiz_classes"
  ON public.quiz_classes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quiz_classes"
  ON public.quiz_classes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage quiz_classes for their quizzes"
  ON public.quiz_classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_classes.quiz_id
      AND q.created_by = auth.uid()
    )
  );

-- Migrate existing class_id data to the new table
INSERT INTO public.quiz_classes (quiz_id, class_id)
SELECT id, class_id
FROM public.quizzes
WHERE class_id IS NOT NULL
ON CONFLICT DO NOTHING;