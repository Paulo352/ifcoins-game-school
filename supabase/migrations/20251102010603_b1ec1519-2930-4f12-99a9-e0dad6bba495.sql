-- Adicionar foreign keys faltantes para pack_purchases
ALTER TABLE public.pack_purchases
DROP CONSTRAINT IF EXISTS pack_purchases_user_id_fkey,
DROP CONSTRAINT IF EXISTS pack_purchases_pack_id_fkey;

-- Adicionar foreign keys corretas
ALTER TABLE public.pack_purchases
ADD CONSTRAINT pack_purchases_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT pack_purchases_pack_id_fkey 
  FOREIGN KEY (pack_id) REFERENCES public.packs(id) ON DELETE CASCADE;

-- Adicionar foreign keys faltantes para user_cards
ALTER TABLE public.user_cards
DROP CONSTRAINT IF EXISTS user_cards_user_id_fkey,
DROP CONSTRAINT IF EXISTS user_cards_card_id_fkey;

ALTER TABLE public.user_cards
ADD CONSTRAINT user_cards_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT user_cards_card_id_fkey 
  FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;

-- Adicionar foreign keys faltantes para pack_cards
ALTER TABLE public.pack_cards
DROP CONSTRAINT IF EXISTS pack_cards_pack_id_fkey,
DROP CONSTRAINT IF EXISTS pack_cards_card_id_fkey;

ALTER TABLE public.pack_cards
ADD CONSTRAINT pack_cards_pack_id_fkey 
  FOREIGN KEY (pack_id) REFERENCES public.packs(id) ON DELETE CASCADE,
ADD CONSTRAINT pack_cards_card_id_fkey 
  FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;