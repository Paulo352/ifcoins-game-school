-- Adicionar campo created_by na tabela cards
ALTER TABLE public.cards
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Atualizar cartas existentes para terem o campo created_by como null (sistema)
UPDATE public.cards
SET created_by = NULL
WHERE created_by IS NULL;