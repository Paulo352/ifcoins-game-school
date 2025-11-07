-- Melhorias no sistema de empréstimos e banco

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_loans_student_id ON loans(student_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_is_overdue ON loans(is_overdue);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_reward_logs_created_at ON reward_logs(created_at DESC);

-- Garantir que função de perdoar dívida está correta
CREATE OR REPLACE FUNCTION public.forgive_loan_debt(loan_id uuid, admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_loan RECORD;
  v_remaining_amount NUMERIC;
  v_installment_value NUMERIC;
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

  -- Calcular valor da parcela
  v_installment_value := v_loan.total_with_interest / NULLIF(v_loan.installments, 0);
  
  -- Calcular quanto falta pagar
  v_remaining_amount := v_loan.total_with_interest - (v_loan.installments_paid * v_installment_value);

  -- Marcar como perdoado
  UPDATE loans
  SET debt_forgiven = true,
      forgiven_by = admin_id,
      forgiven_at = now(),
      status = 'repaid'
  WHERE id = loan_id;

  -- Atualizar banco removendo da circulação
  UPDATE bank
  SET coins_in_circulation = GREATEST(coins_in_circulation - v_remaining_amount::INTEGER, 0)
  WHERE id = (SELECT id FROM bank LIMIT 1);

  -- Registrar transação
  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (NULL, v_loan.student_id, v_remaining_amount::INTEGER, 'loan_forgiven', 'Dívida de empréstimo perdoada pelo administrador');

  RETURN json_build_object(
    'success', true, 
    'message', 'Dívida perdoada com sucesso', 
    'amount_forgiven', v_remaining_amount
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;