-- Add epic rarity to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'epic' 
    AND enumtypid = 'card_rarity'::regtype
  ) THEN
    ALTER TYPE card_rarity ADD VALUE 'epic';
  END IF;
END $$;

-- Add probability_epic column to packs table
ALTER TABLE packs 
ADD COLUMN IF NOT EXISTS probability_epic integer NOT NULL DEFAULT 5;

-- Add comment
COMMENT ON COLUMN packs.probability_epic IS 'Probabilidade de carta épica (roxo) no pacote';