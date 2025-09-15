-- Adicionar coluna bonus_coins na tabela events
ALTER TABLE public.events 
ADD COLUMN bonus_coins INTEGER DEFAULT 0;