-- Primeiro, vamos adicionar a coluna pack_type que está faltando na tabela packs
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS pack_type text NOT NULL DEFAULT 'random' CHECK (pack_type IN ('random', 'fixed'));

-- Criar tabela para relacionar pacotes com cartas específicas (para pacotes fixos)
CREATE TABLE IF NOT EXISTS public.pack_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(pack_id, card_id)
);

-- Habilitar RLS na tabela pack_cards
ALTER TABLE public.pack_cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pack_cards
CREATE POLICY "Admins can manage pack cards" 
ON public.pack_cards 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Students can view pack cards" 
ON public.pack_cards 
FOR SELECT
USING (true);

-- Criar tabela para histórico de compras de pacotes
CREATE TABLE IF NOT EXISTS public.pack_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE RESTRICT,
  cards_received jsonb NOT NULL DEFAULT '[]'::jsonb,
  coins_spent integer NOT NULL,
  purchased_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela pack_purchases
ALTER TABLE public.pack_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pack_purchases
CREATE POLICY "Users can view own pack purchases" 
ON public.pack_purchases 
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create pack purchases" 
ON public.pack_purchases 
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all pack purchases" 
ON public.pack_purchases 
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));