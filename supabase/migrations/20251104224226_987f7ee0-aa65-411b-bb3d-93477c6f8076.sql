-- Adicionar colunas para sistema de contrapropostas em empréstimos
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS counter_installments INTEGER,
ADD COLUMN IF NOT EXISTS counter_payment_method TEXT,
ADD COLUMN IF NOT EXISTS counter_status TEXT DEFAULT 'none' CHECK (counter_status IN ('none', 'pending', 'accepted', 'rejected'));

-- Adicionar coluna para perdoar dívidas
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS debt_forgiven BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS forgiven_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS forgiven_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo reward_type e reward_card_id em quizzes se não existir
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'coins' CHECK (reward_type IN ('coins', 'card')),
ADD COLUMN IF NOT EXISTS reward_card_id UUID REFERENCES cards(id);

-- Função para perdoar dívida
CREATE OR REPLACE FUNCTION forgive_loan_debt(
  loan_id UUID,
  admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_loan RECORD;
  v_remaining_amount NUMERIC;
BEGIN
  -- Verificar se é admin
  IF NOT has_role(admin_id, 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'error', 'Apenas admins podem perdoar dívidas');
  END IF;

  -- Buscar empréstimo
  SELECT * INTO v_loan
  FROM loans
  WHERE id = loan_id AND status = 'approved' AND debt_forgiven = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Empréstimo não encontrado ou já foi perdoado');
  END IF;

  -- Calcular quanto falta pagar
  v_remaining_amount := v_loan.total_with_interest - (
    SELECT COALESCE(SUM(amount), 0)
    FROM loan_payments
    WHERE loan_payments.loan_id = forgive_loan_debt.loan_id
  );

  -- Marcar como perdoado
  UPDATE loans
  SET debt_forgiven = true,
      forgiven_by = admin_id,
      forgiven_at = now(),
      status = 'repaid'
  WHERE id = loan_id;

  -- Registrar transação
  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (NULL, v_loan.student_id, v_remaining_amount::INTEGER, 'loan_forgiven', 'Dívida de empréstimo perdoada pelo administrador');

  RETURN json_build_object('success', true, 'message', 'Dívida perdoada com sucesso', 'amount_forgiven', v_remaining_amount);
END;
$$;

-- Função para aceitar contraproposta do empréstimo
CREATE OR REPLACE FUNCTION accept_loan_counter_proposal(
  loan_id UUID,
  student_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_loan RECORD;
  v_interest_rate NUMERIC;
  v_total_with_interest NUMERIC;
BEGIN
  -- Buscar empréstimo
  SELECT * INTO v_loan
  FROM loans
  WHERE id = loan_id AND loans.student_id = accept_loan_counter_proposal.student_id AND counter_status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contraproposta não encontrada');
  END IF;

  -- Calcular juros da contraproposta
  v_interest_rate := v_loan.counter_installments * 2.0;
  v_total_with_interest := v_loan.amount * (1 + v_interest_rate / 100.0);

  -- Aplicar contraproposta
  UPDATE loans
  SET installments = v_loan.counter_installments,
      payment_method = v_loan.counter_payment_method,
      interest_rate = v_interest_rate,
      total_with_interest = v_total_with_interest,
      counter_status = 'accepted'
  WHERE id = loan_id;

  RETURN json_build_object('success', true, 'message', 'Contraproposta aceita com sucesso');
END;
$$;

-- Função para rejeitar contraproposta do empréstimo
CREATE OR REPLACE FUNCTION reject_loan_counter_proposal(
  loan_id UUID,
  student_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar status da contraproposta
  UPDATE loans
  SET counter_status = 'rejected'
  WHERE id = loan_id AND loans.student_id = reject_loan_counter_proposal.student_id AND counter_status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contraproposta não encontrada');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Contraproposta rejeitada');
END;
$$;