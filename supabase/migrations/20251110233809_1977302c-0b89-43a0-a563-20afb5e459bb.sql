-- Criar campo is_special na tabela cards se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'is_special'
  ) THEN
    ALTER TABLE public.cards 
    ADD COLUMN is_special BOOLEAN NOT NULL DEFAULT false;
    
    COMMENT ON COLUMN public.cards.is_special IS 'Indica se a carta é exclusiva para alunos específicos (não aparece na loja)';
  END IF;
END$$;

-- Atualizar índice para incluir is_special
CREATE INDEX IF NOT EXISTS idx_cards_shop 
ON public.cards (available, is_special, rarity DESC) 
WHERE available = true AND is_special = false;