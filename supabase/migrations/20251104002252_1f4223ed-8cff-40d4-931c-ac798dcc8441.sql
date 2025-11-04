-- Corrigir função buy_market_item com WHERE clause
DROP FUNCTION IF EXISTS public.buy_market_item(uuid, uuid);

CREATE OR REPLACE FUNCTION public.buy_market_item(listing_id uuid, buyer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  SET coins_in_circulation = coins_in_circulation - v_fee
  WHERE id = (SELECT id FROM bank LIMIT 1);

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

-- Adicionar colunas ao loans para sistema de parcelas
ALTER TABLE loans ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_rate numeric DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_with_interest numeric DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'manual'; -- 'manual' ou 'automatic'
ALTER TABLE loans ADD COLUMN IF NOT EXISTS installments_paid integer DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS next_payment_date timestamp with time zone;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS is_overdue boolean DEFAULT false;

-- Criar tabela de pagamentos de empréstimo
CREATE TABLE IF NOT EXISTS loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at timestamp with time zone DEFAULT now(),
  installment_number integer NOT NULL,
  is_automatic boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS para loan_payments
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar pagamentos"
  ON loan_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Alunos podem ver seus pagamentos"
  ON loan_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_payments.loan_id
      AND loans.student_id = auth.uid()
    )
  );

-- Atualizar função de aprovação de empréstimo com parcelas
CREATE OR REPLACE FUNCTION public.process_loan_approval(
  loan_id uuid, 
  admin_id uuid, 
  installments integer DEFAULT 1,
  payment_method text DEFAULT 'manual'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_loan_amount integer;
  v_student_id uuid;
  v_bank_balance integer;
  v_bank_id uuid;
  v_interest_rate numeric;
  v_total_with_interest numeric;
BEGIN
  -- Verificar se é admin
  IF NOT has_role(admin_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Apenas admins podem aprovar empréstimos');
  END IF;

  -- Validar parcelas
  IF installments < 1 OR installments > 10 THEN
    RETURN json_build_object('success', false, 'error', 'Número de parcelas deve ser entre 1 e 10');
  END IF;

  -- Buscar dados do empréstimo
  SELECT amount, student_id INTO v_loan_amount, v_student_id
  FROM loans
  WHERE id = loan_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Empréstimo não encontrado ou já processado');
  END IF;

  -- Buscar ID e saldo do banco
  SELECT id, (total_coins - coins_in_circulation) INTO v_bank_id, v_bank_balance
  FROM bank
  LIMIT 1;

  IF v_bank_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Banco não configurado');
  END IF;

  IF v_bank_balance < v_loan_amount THEN
    RETURN json_build_object('success', false, 'error', 'Banco sem saldo suficiente');
  END IF;

  -- Calcular juros: 2% por parcela
  v_interest_rate := installments * 2.0;
  v_total_with_interest := v_loan_amount * (1 + v_interest_rate / 100.0);

  -- Atualizar empréstimo
  UPDATE loans
  SET status = 'approved',
      reviewed_by = admin_id,
      reviewed_at = now(),
      installments = process_loan_approval.installments,
      interest_rate = v_interest_rate,
      total_with_interest = v_total_with_interest,
      payment_method = process_loan_approval.payment_method,
      next_payment_date = now() + interval '7 days'
  WHERE id = loan_id;

  -- Adicionar moedas ao aluno
  UPDATE profiles
  SET coins = coins + v_loan_amount,
      updated_at = now()
  WHERE id = v_student_id;

  -- Atualizar banco
  UPDATE bank
  SET coins_in_circulation = coins_in_circulation + v_loan_amount,
      updated_at = now()
  WHERE id = v_bank_id;

  -- Registrar transação
  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (NULL, v_student_id, v_loan_amount, 'loan_granted', 
          format('Empréstimo aprovado - %s parcelas - Taxa: %s%%', installments, v_interest_rate));

  RETURN json_build_object(
    'success', true, 
    'message', 'Empréstimo aprovado com sucesso',
    'installments', installments,
    'interest_rate', v_interest_rate,
    'total_with_interest', v_total_with_interest
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Adicionar campos para cartas especiais
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_special boolean DEFAULT false;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id);

-- Adicionar opção de recompensa por carta nos quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'coins'; -- 'coins' ou 'card'
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS reward_card_id uuid REFERENCES cards(id);

-- Atualizar função complete_quiz para suportar cartas
CREATE OR REPLACE FUNCTION public.complete_quiz(attempt_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quiz_id UUID;
  v_reward_coins INTEGER;
  v_reward_type TEXT;
  v_reward_card_id UUID;
  v_score INTEGER;
  v_total_questions INTEGER;
  v_coins_to_award INTEGER;
  v_passing_score DECIMAL := 0.7;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
  END IF;

  SELECT qa.quiz_id, qa.score, qa.total_questions, q.reward_coins, q.reward_type, q.reward_card_id
  INTO v_quiz_id, v_score, v_total_questions, v_reward_coins, v_reward_type, v_reward_card_id
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.id = attempt_id AND qa.user_id = user_id AND qa.is_completed = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tentativa não encontrada ou já finalizada');
  END IF;

  -- Verificar se passou
  IF v_total_questions > 0 AND (v_score::DECIMAL / v_total_questions::DECIMAL) >= v_passing_score THEN
    -- Dar recompensa baseado no tipo
    IF v_reward_type = 'card' AND v_reward_card_id IS NOT NULL THEN
      -- Dar carta
      INSERT INTO user_cards (user_id, card_id, quantity)
      VALUES (user_id, v_reward_card_id, 1)
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET quantity = user_cards.quantity + 1;
      
      v_coins_to_award := 0;
    ELSE
      -- Dar moedas
      v_coins_to_award := v_reward_coins;
      UPDATE profiles
      SET coins = coins + v_coins_to_award,
          updated_at = now()
      WHERE id = user_id;
    END IF;
  ELSE
    v_coins_to_award := 0;
  END IF;

  -- Atualizar tentativa
  UPDATE quiz_attempts
  SET is_completed = true,
      completed_at = now(),
      coins_earned = v_coins_to_award
  WHERE id = attempt_id;

  RETURN json_build_object(
    'success', true,
    'coins_earned', v_coins_to_award,
    'card_rewarded', v_reward_type = 'card' AND v_reward_card_id IS NOT NULL,
    'score', v_score,
    'total_questions', v_total_questions,
    'passed', (v_score::DECIMAL / v_total_questions::DECIMAL) >= v_passing_score
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', COALESCE(SQLERRM, 'Erro ao completar quiz'));
END;
$$;