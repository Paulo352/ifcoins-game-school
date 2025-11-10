-- Criar índice para otimizar o ranking de quizzes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_ranking 
ON quiz_attempts (user_id, is_completed, score DESC) 
WHERE is_completed = true;

-- Criar índice para perfis de estudantes
CREATE INDEX IF NOT EXISTS idx_profiles_student_ranking 
ON profiles (id, role) 
WHERE role = 'student';