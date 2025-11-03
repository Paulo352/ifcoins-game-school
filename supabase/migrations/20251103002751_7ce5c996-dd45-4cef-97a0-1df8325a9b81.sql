-- Criar tabela do banco (IFBank)
CREATE TABLE IF NOT EXISTS public.bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_coins integer NOT NULL DEFAULT 10000,
  coins_in_circulation integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Inserir registro inicial do banco
INSERT INTO public.bank (total_coins, coins_in_circulation)
VALUES (10000, 0)
ON CONFLICT DO NOTHING;

-- Criar enum para tipos de transação
CREATE TYPE public.transaction_type AS ENUM (
  'send',           -- Envio entre usuários
  'purchase',       -- Compra de carta/pacote
  'reward',         -- Recompensa de professor
  'loan_granted',   -- Empréstimo concedido
  'loan_repaid',    -- Empréstimo pago
  'market_sale',    -- Venda no marketplace
  'market_fee',     -- Taxa do marketplace
  'system_buy'      -- Sistema comprou carta
);

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  type public.transaction_type NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Criar enum para status de empréstimo
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'denied', 'repaid');

-- Criar tabela de empréstimos
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  status public.loan_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar enum para status de anúncio
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'expired', 'removed');

-- Criar tabela de anúncios do marketplace
CREATE TABLE IF NOT EXISTS public.market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  price integer NOT NULL,
  status public.listing_status NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  sold_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sold_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de reputação
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  sales_count integer NOT NULL DEFAULT 0,
  purchases_count integer NOT NULL DEFAULT 0,
  reputation_level text NOT NULL DEFAULT 'iniciante',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bank
CREATE POLICY "Admins podem gerenciar banco"
  ON public.bank FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos podem ver saldo do banco"
  ON public.bank FOR SELECT
  USING (true);

-- Políticas RLS para transactions
CREATE POLICY "Admins podem ver todas transações"
  ON public.transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver suas transações"
  ON public.transactions FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Sistema pode criar transações"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para loans
CREATE POLICY "Admins podem gerenciar empréstimos"
  ON public.loans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Alunos podem criar empréstimos"
  ON public.loans FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Alunos podem ver seus empréstimos"
  ON public.loans FOR SELECT
  USING (student_id = auth.uid());

-- Políticas RLS para market_listings
CREATE POLICY "Todos podem ver anúncios ativos"
  ON public.market_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Vendedores podem criar anúncios"
  ON public.market_listings FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Vendedores podem atualizar seus anúncios"
  ON public.market_listings FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Admins podem gerenciar anúncios"
  ON public.market_listings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Políticas RLS para user_reputation
CREATE POLICY "Todos podem ver reputação"
  ON public.user_reputation FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar reputação"
  ON public.user_reputation FOR ALL
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_bank_updated_at
  BEFORE UPDATE ON public.bank
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_listings_updated_at
  BEFORE UPDATE ON public.market_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reputation_updated_at
  BEFORE UPDATE ON public.user_reputation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para processar empréstimo aprovado
CREATE OR REPLACE FUNCTION public.process_loan_approval(
  loan_id uuid,
  admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan_amount integer;
  v_student_id uuid;
  v_bank_balance integer;
BEGIN
  -- Verificar se é admin
  IF NOT has_role(admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Apenas admins podem aprovar empréstimos');
  END IF;

  -- Buscar dados do empréstimo
  SELECT amount, student_id INTO v_loan_amount, v_student_id
  FROM loans
  WHERE id = loan_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Empréstimo não encontrado ou já processado');
  END IF;

  -- Verificar saldo do banco
  SELECT total_coins - coins_in_circulation INTO v_bank_balance
  FROM bank
  LIMIT 1;

  IF v_bank_balance < v_loan_amount THEN
    RETURN json_build_object('success', false, 'error', 'Banco sem saldo suficiente');
  END IF;

  -- Atualizar empréstimo
  UPDATE loans
  SET status = 'approved',
      reviewed_by = admin_id,
      reviewed_at = now()
  WHERE id = loan_id;

  -- Adicionar moedas ao aluno
  UPDATE profiles
  SET coins = coins + v_loan_amount
  WHERE id = v_student_id;

  -- Atualizar banco
  UPDATE bank
  SET coins_in_circulation = coins_in_circulation + v_loan_amount;

  -- Registrar transação
  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (NULL, v_student_id, v_loan_amount, 'loan_granted', 'Empréstimo aprovado');

  RETURN json_build_object('success', true, 'message', 'Empréstimo aprovado com sucesso');
END;
$$;

-- Função para comprar item do marketplace
CREATE OR REPLACE FUNCTION public.buy_market_item(
  listing_id uuid,
  buyer_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price integer;
  v_seller_id uuid;
  v_card_id uuid;
  v_buyer_coins integer;
  v_fee integer;
  v_seller_amount integer;
BEGIN
  -- Verificar autenticação
  IF auth.uid() IS NULL OR auth.uid() <> buyer_id THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Buscar dados do anúncio
  SELECT price, seller_id, card_id
  INTO v_price, v_seller_id, v_card_id
  FROM market_listings
  WHERE id = listing_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Anúncio não encontrado ou não disponível');
  END IF;

  -- Não pode comprar do próprio anúncio
  IF v_seller_id = buyer_id THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível comprar seu próprio anúncio');
  END IF;

  -- Verificar moedas do comprador
  SELECT coins INTO v_buyer_coins
  FROM profiles
  WHERE id = buyer_id;

  IF v_buyer_coins < v_price THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Calcular taxa (5%)
  v_fee := CEIL(v_price * 0.05);
  v_seller_amount := v_price - v_fee;

  -- Remover carta do vendedor
  UPDATE user_cards
  SET quantity = quantity - 1
  WHERE user_id = v_seller_id AND card_id = v_card_id;

  DELETE FROM user_cards
  WHERE user_id = v_seller_id AND card_id = v_card_id AND quantity <= 0;

  -- Adicionar carta ao comprador
  INSERT INTO user_cards (user_id, card_id, quantity)
  VALUES (buyer_id, v_card_id, 1)
  ON CONFLICT (user_id, card_id)
  DO UPDATE SET quantity = user_cards.quantity + 1;

  -- Deduzir moedas do comprador
  UPDATE profiles
  SET coins = coins - v_price
  WHERE id = buyer_id;

  -- Adicionar moedas ao vendedor (menos taxa)
  UPDATE profiles
  SET coins = coins + v_seller_amount
  WHERE id = v_seller_id;

  -- Retornar taxa ao banco
  UPDATE bank
  SET coins_in_circulation = coins_in_circulation - v_fee;

  -- Atualizar anúncio
  UPDATE market_listings
  SET status = 'sold',
      sold_to = buyer_id,
      sold_at = now()
  WHERE id = listing_id;

  -- Registrar transações
  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (buyer_id, v_seller_id, v_seller_amount, 'market_sale', 'Venda no marketplace');

  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (buyer_id, NULL, v_fee, 'market_fee', 'Taxa do marketplace (5%)');

  -- Atualizar reputação
  INSERT INTO user_reputation (user_id, sales_count)
  VALUES (v_seller_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET sales_count = user_reputation.sales_count + 1;

  INSERT INTO user_reputation (user_id, purchases_count)
  VALUES (buyer_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET purchases_count = user_reputation.purchases_count + 1;

  RETURN json_build_object('success', true, 'message', 'Compra realizada com sucesso');
END;
$$;