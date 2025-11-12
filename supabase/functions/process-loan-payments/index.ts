import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando processamento de pagamentos automáticos...');

    // Buscar empréstimos aprovados com pagamento automático e data de pagamento vencida
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'approved')
      .eq('payment_method', 'automatic')
      .eq('debt_forgiven', false)
      .lte('next_payment_date', new Date().toISOString())
      .lt('installments_paid', supabase.rpc('installments'));

    if (loansError) {
      console.error('Erro ao buscar empréstimos:', loansError);
      throw loansError;
    }

    console.log(`Encontrados ${loans?.length || 0} empréstimos para processar`);

    const results = [];

    for (const loan of loans || []) {
      try {
        console.log(`Processando empréstimo ${loan.id} do aluno ${loan.student_id}`);

        // Chamar função para processar pagamento
        const { data: result, error: paymentError } = await supabase.rpc('process_loan_payment', {
          loan_id: loan.id
        });

        if (paymentError) {
          console.error(`Erro ao processar pagamento do empréstimo ${loan.id}:`, paymentError);
          results.push({
            loan_id: loan.id,
            success: false,
            error: paymentError.message
          });
          continue;
        }

        console.log(`Pagamento processado com sucesso para empréstimo ${loan.id}:`, result);
        results.push({
          loan_id: loan.id,
          success: true,
          result: result
        });

        // Criar notificação para o aluno
        if (result.success) {
          await supabase.from('notifications').insert({
            user_id: loan.student_id,
            title: 'Pagamento de Empréstimo',
            message: `Parcela ${result.installment_paid}/${loan.installments} foi descontada automaticamente. Restam ${result.remaining_installments} parcelas.`,
            type: 'loan_payment'
          });
        }
      } catch (error) {
        console.error(`Erro ao processar empréstimo ${loan.id}:`, error);
        results.push({
          loan_id: loan.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log('Processamento concluído:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processamento de pagamentos concluído',
        processed: results.length,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[LOAN_PAYMENTS] Processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Payment processing failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});