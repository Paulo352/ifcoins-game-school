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

    console.log('Iniciando distribuição de moedas diárias...');

    // Buscar configurações
    const { data: configs } = await supabase
      .from('admin_config')
      .select('*')
      .in('config_key', [
        'daily_coins_enabled',
        'daily_coins_amount',
        'daily_coins_days',
        'daily_coins_target_roles'
      ]);

    const configMap = configs?.reduce((acc, c) => ({ ...acc, [c.config_key]: c.config_value }), {} as Record<string, string>) || {};

    // Verificar se está habilitado
    if (configMap['daily_coins_enabled'] !== 'true') {
      console.log('Distribuição diária não está habilitada');
      return new Response(
        JSON.stringify({ success: false, message: 'Distribuição não habilitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = parseInt(configMap['daily_coins_amount'] || '10');
    const targetRoles = configMap['daily_coins_target_roles'] || 'student';
    const daysConfig = configMap['daily_coins_days'] || 'all';

    // Verificar dia da semana
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.

    let shouldDistribute = true;
    if (daysConfig === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      shouldDistribute = false;
    } else if (daysConfig === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) {
      shouldDistribute = false;
    } else if (daysConfig === 'monday' && dayOfWeek !== 1) {
      shouldDistribute = false;
    } else if (daysConfig === 'friday' && dayOfWeek !== 5) {
      shouldDistribute = false;
    }

    if (!shouldDistribute) {
      console.log('Hoje não é um dia de distribuição');
      return new Response(
        JSON.stringify({ success: false, message: 'Não é dia de distribuição' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuários elegíveis
    let query = supabase.from('profiles').select('id, name');
    
    if (targetRoles === 'student') {
      query = query.eq('role', 'student');
    } else if (targetRoles === 'teacher') {
      query = query.eq('role', 'teacher');
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    console.log(`Distribuindo ${amount} moedas para ${users?.length || 0} usuários`);

    const results = [];
    const todayDate = today.toISOString().split('T')[0];

    for (const user of users || []) {
      try {
        // Verificar se já recebeu hoje
        const { data: existing } = await supabase
          .from('daily_coin_distributions')
          .select('id')
          .eq('user_id', user.id)
          .eq('distribution_date', todayDate)
          .single();

        if (existing) {
          console.log(`Usuário ${user.id} já recebeu moedas hoje`);
          continue;
        }

        // Adicionar moedas
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ coins: supabase.rpc('coins') + amount })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Erro ao atualizar moedas do usuário ${user.id}:`, updateError);
          results.push({ user_id: user.id, success: false, error: updateError.message });
          continue;
        }

        // Registrar distribuição
        await supabase.from('daily_coin_distributions').insert({
          user_id: user.id,
          amount: amount,
          distribution_date: todayDate
        });

        // Criar notificação
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Moedas Diárias',
          message: `Você recebeu ${amount} IFCoins hoje!`,
          type: 'daily_coins'
        });

        console.log(`Distribuído ${amount} moedas para ${user.name}`);
        results.push({ user_id: user.id, success: true, amount: amount });
      } catch (error) {
        console.error(`Erro ao processar usuário ${user.id}:`, error);
        results.push({ user_id: user.id, success: false, error: error.message });
      }
    }

    console.log('Distribuição concluída:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Distribuição concluída',
        distributed: results.filter(r => r.success).length,
        total: results.length,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[DAILY_COINS] Distribution error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Distribution failed' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});