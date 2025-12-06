-- Adicionar política para alunos verem informações básicas de professores
CREATE POLICY "Students can view teacher basic info"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND role = 'teacher'::user_role
);