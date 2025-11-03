-- Inserir registro inicial do banco se não existir
INSERT INTO public.bank (id, total_coins, coins_in_circulation)
VALUES (gen_random_uuid(), 10000, 0)
ON CONFLICT DO NOTHING;

-- Garantir que sempre há exatamente 1 registro no banco
CREATE OR REPLACE FUNCTION ensure_single_bank_record()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM bank) > 1 THEN
    RAISE EXCEPTION 'Apenas um registro de banco é permitido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_single_bank_record
BEFORE INSERT ON bank
FOR EACH ROW
EXECUTE FUNCTION ensure_single_bank_record();

-- Atualizar função de aprovação de empréstimo
CREATE OR REPLACE FUNCTION public.process_loan_approval(loan_id uuid, admin_id uuid)
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

  -- Atualizar empréstimo
  UPDATE loans
  SET status = 'approved',
      reviewed_by = admin_id,
      reviewed_at = now()
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
  VALUES (NULL, v_student_id, v_loan_amount, 'loan_granted', 'Empréstimo aprovado');

  RETURN json_build_object('success', true, 'message', 'Empréstimo aprovado com sucesso');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Criar trigger para atualizar coins_in_circulation quando profiles.coins mudar
CREATE OR REPLACE FUNCTION update_bank_circulation()
RETURNS TRIGGER AS $$
DECLARE
  v_bank_id uuid;
  v_total_coins integer;
BEGIN
  -- Calcular total de moedas em circulação
  SELECT COALESCE(SUM(coins), 0) INTO v_total_coins
  FROM profiles;

  -- Atualizar banco
  SELECT id INTO v_bank_id FROM bank LIMIT 1;
  
  IF v_bank_id IS NOT NULL THEN
    UPDATE bank
    SET coins_in_circulation = v_total_coins,
        updated_at = now()
    WHERE id = v_bank_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS update_circulation_on_profile_change ON profiles;
CREATE TRIGGER update_circulation_on_profile_change
AFTER INSERT OR UPDATE OF coins OR DELETE ON profiles
FOR EACH STATEMENT
EXECUTE FUNCTION update_bank_circulation();