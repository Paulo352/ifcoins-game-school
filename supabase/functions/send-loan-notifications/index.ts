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

    console.log('Verificando empréstimos para notificações...');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Buscar empréstimos que estão próximos do vencimento (3 dias)
    const { data: loansNearDue, error: nearDueError } = await supabase
      .from('loans')
      .select('*, student:profiles!loans_student_id_fkey(name)')
      .eq('status', 'approved')
      .eq('debt_forgiven', false)
      .eq('payment_method', 'manual')
      .gte('next_payment_date', now.toISOString())
      .lte('next_payment_date', threeDaysFromNow.toISOString());

    if (nearDueError) {
      console.error('Erro ao buscar empréstimos próximos do vencimento:', nearDueError);
    }

    // Criar notificações para empréstimos próximos do vencimento
    for (const loan of loansNearDue || []) {
      const daysUntilDue = Math.ceil(
        (new Date(loan.next_payment_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await supabase.from('notifications').insert({
        user_id: loan.student_id,
        title: '⏰ Parcela Próxima do Vencimento',
        message: `Sua parcela de ${(loan.total_with_interest / loan.installments).toFixed(0)} IFC vence em ${daysUntilDue} dia(s)!`,
        type: 'loan_reminder'
      });

      console.log(`Notificação enviada para ${loan.student?.name} - ${daysUntilDue} dias até vencimento`);
    }

    // Buscar empréstimos em atraso
    const { data: overdueLoans, error: overdueError } = await supabase
      .from('loans')
      .select('*, student:profiles!loans_student_id_fkey(name)')
      .eq('status', 'approved')
      .eq('is_overdue', true)
      .eq('debt_forgiven', false)
      .eq('payment_method', 'manual');

    if (overdueError) {
      console.error('Erro ao buscar empréstimos atrasados:', overdueError);
    }

    // Criar notificações para empréstimos atrasados
    for (const loan of overdueLoans || []) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(loan.next_payment_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      await supabase.from('notifications').insert({
        user_id: loan.student_id,
        title: '🚨 Parcela em Atraso',
        message: `Sua parcela está atrasada há ${daysOverdue} dia(s)! Taxa adicional de 5% será aplicada.`,
        type: 'loan_overdue'
      });

      console.log(`Notificação de atraso enviada para ${loan.student?.name} - ${daysOverdue} dias atrasado`);
    }

    // Buscar pagamentos automáticos recentes (últimas 24h)
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('loan_payments')
      .select(`
        *,
        loan:loans(
          student_id,
          student:profiles!loans_student_id_fkey(name)
        )
      `)
      .eq('is_automatic', true)
      .gte('paid_at', yesterday.toISOString());

    if (paymentsError) {
      console.error('Erro ao buscar pagamentos recentes:', paymentsError);
    }

    // Criar notificações de confirmação de pagamentos automáticos
    for (const payment of recentPayments || []) {
      if (payment.loan?.student_id) {
        await supabase.from('notifications').insert({
          user_id: payment.loan.student_id,
          title: '✅ Pagamento Automático Realizado',
          message: `Parcela de ${payment.amount.toFixed(0)} IFC foi descontada automaticamente do seu saldo.`,
          type: 'loan_payment_confirmation'
        });

        console.log(`Confirmação de pagamento enviada para ${payment.loan.student?.name}`);
      }
    }

    const totalNotifications = 
      (loansNearDue?.length || 0) + 
      (overdueLoans?.length || 0) + 
      (recentPayments?.length || 0);

    console.log(`Total de notificações enviadas: ${totalNotifications}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notificações de empréstimos enviadas',
        stats: {
          nearDue: loansNearDue?.length || 0,
          overdue: overdueLoans?.length || 0,
          paymentConfirmations: recentPayments?.length || 0,
          total: totalNotifications
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Erro no envio de notificações:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
