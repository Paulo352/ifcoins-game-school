-- Corrigir função forgive_loan_debt
CREATE OR REPLACE FUNCTION public.forgive_loan_debt(loan_id uuid, admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_remaining_amount := v_loan.total_with_interest - (v_loan.installments_paid * (v_loan.total_with_interest / v_loan.installments));

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
$function$;

-- Adicionar função para deletar pacotes específicos
DO $$
BEGIN
  DELETE FROM pack_cards WHERE pack_id IN (
    SELECT id FROM packs WHERE name IN ('cachorro', 'Pacote iniciante')
  );
  DELETE FROM packs WHERE name IN ('cachorro', 'Pacote iniciante');
END
$$;

-- Criar tabela para configuração de distribuição diária de moedas
CREATE TABLE IF NOT EXISTS daily_coin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount integer NOT NULL DEFAULT 10,
  enabled boolean NOT NULL DEFAULT false,
  target_role text NOT NULL DEFAULT 'student',
  reset_weekly boolean NOT NULL DEFAULT false,
  monday boolean NOT NULL DEFAULT true,
  tuesday boolean NOT NULL DEFAULT true,
  wednesday boolean NOT NULL DEFAULT true,
  thursday boolean NOT NULL DEFAULT true,
  friday boolean NOT NULL DEFAULT true,
  saturday boolean NOT NULL DEFAULT false,
  sunday boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_coin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage daily coin config"
ON daily_coin_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view daily coin config"
ON daily_coin_config
FOR SELECT
TO authenticated
USING (true);

-- Inserir configuração padrão se não existir
INSERT INTO daily_coin_config (amount, enabled, target_role, reset_weekly)
SELECT 10, false, 'student', false
WHERE NOT EXISTS (SELECT 1 FROM daily_coin_config LIMIT 1);

-- Adicionar coluna last_daily_reward em profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_reward timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_streak integer DEFAULT 0;

-- Função para pagamento antecipado de empréstimo
CREATE OR REPLACE FUNCTION public.early_loan_payment(loan_id uuid, user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_loan RECORD;
  v_remaining_amount NUMERIC;
  v_user_coins INTEGER;
BEGIN
  -- Verificar autenticação
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RETURN json_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Buscar empréstimo
  SELECT * INTO v_loan
  FROM loans
  WHERE id = loan_id AND student_id = user_id AND status = 'approved' AND debt_forgiven = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Empréstimo não encontrado');
  END IF;

  -- Calcular quanto falta pagar
  v_remaining_amount := v_loan.total_with_interest - (v_loan.installments_paid * (v_loan.total_with_interest / v_loan.installments));

  -- Verificar moedas do usuário
  SELECT coins INTO v_user_coins FROM profiles WHERE id = user_id;

  IF v_user_coins < v_remaining_amount THEN
    RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Deduzir moedas
  UPDATE profiles SET coins = coins - v_remaining_amount::INTEGER WHERE id = user_id;

  -- Marcar empréstimo como pago
  UPDATE loans
  SET status = 'repaid',
      installments_paid = installments
  WHERE id = loan_id;

  -- Atualizar banco
  UPDATE bank
  SET coins_in_circulation = coins_in_circulation - v_remaining_amount::INTEGER
  WHERE id = (SELECT id FROM bank LIMIT 1);

  -- Registrar transação
  INSERT INTO transactions (sender_id, receiver_id, amount, type, description)
  VALUES (user_id, NULL, v_remaining_amount::INTEGER, 'loan_repayment', 'Pagamento antecipado de empréstimo');

  RETURN json_build_object('success', true, 'message', 'Empréstimo quitado com sucesso', 'amount_paid', v_remaining_amount);
END;
$function$;