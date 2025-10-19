-- ============================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- ============================================

-- ============================================
-- ISSUE 1: Fix Recursive RLS Policies on Profiles Table
-- Replace direct profiles.role checks with security definer functions
-- ============================================

-- Drop problematic policies that query profiles.role
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage packs" ON public.packs;
DROP POLICY IF EXISTS "Admins can manage pack cards" ON public.pack_cards;
DROP POLICY IF EXISTS "Admins can manage polls" ON public.polls;
DROP POLICY IF EXISTS "Admins can manage poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Professores e admins podem gerenciar quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Professores e admins podem gerenciar perguntas" ON public.quiz_questions;
DROP POLICY IF EXISTS "Professores e admins podem ver todas tentativas" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Professores e admins podem ver todas respostas" ON public.quiz_answers;
DROP POLICY IF EXISTS "Teachers and admins can view reward logs" ON public.reward_logs;
DROP POLICY IF EXISTS "Teachers and admins can create reward logs" ON public.reward_logs;
DROP POLICY IF EXISTS "Teachers can view student profiles (limited)" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student data" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all pack purchases" ON public.pack_purchases;

-- Recreate policies using security definer functions (non-recursive)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage cards"
ON public.cards FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage packs"
ON public.packs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage pack cards"
ON public.pack_cards FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage polls"
ON public.polls FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage poll options"
ON public.poll_options FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers and admins can manage quizzes"
ON public.quizzes FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can manage quiz questions"
ON public.quiz_questions FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can view all quiz answers"
ON public.quiz_answers FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can view reward logs"
ON public.reward_logs FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can create reward logs"
ON public.reward_logs FOR INSERT
WITH CHECK (
  teacher_id = auth.uid() AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'teacher'::app_role)
  )
);

CREATE POLICY "Teachers can view student profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND 
  has_role(id, 'student'::app_role)
);

CREATE POLICY "Admins can view all pack purchases"
ON public.pack_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- ISSUE 2: Fix Security Definer Views
-- Convert to SECURITY INVOKER to respect RLS
-- ============================================

-- Drop existing security definer views
DROP VIEW IF EXISTS public.rankings_view;
DROP VIEW IF EXISTS public.rankings_secure;
DROP VIEW IF EXISTS public.collection_stats_view;

-- Recreate rankings_view as SECURITY INVOKER (respects RLS)
CREATE VIEW public.rankings_view
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.coins,
  p.created_at
FROM public.profiles p
WHERE has_role(p.id, 'student'::app_role)
ORDER BY p.coins DESC;

-- Recreate rankings_secure as SECURITY INVOKER
CREATE VIEW public.rankings_secure
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.coins,
  p.created_at
FROM public.profiles p
WHERE has_role(p.id, 'student'::app_role)
ORDER BY p.coins DESC
LIMIT 50;

-- Recreate collection_stats_view as SECURITY INVOKER
CREATE VIEW public.collection_stats_view
WITH (security_invoker = true)
AS
SELECT 
  uc.card_id,
  SUM(uc.quantity) as total_owned,
  COUNT(DISTINCT uc.user_id) as owners_count
FROM public.user_cards uc
GROUP BY uc.card_id;