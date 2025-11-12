-- Atualizar todos os estudantes para a turma "Informática - 2025"
UPDATE profiles 
SET 
  class = 'Informática - 2025',
  updated_at = now()
WHERE role = 'student';