-- Add 'epic' to card_rarity enum
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'epic';

-- Update any existing constraints if needed
COMMENT ON TYPE card_rarity IS 'Card rarity levels: common, rare, legendary, mythic, epic';