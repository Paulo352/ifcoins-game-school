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

    // Buscar configurações da tabela daily_coin_config
    const { data: dailyConfig, error: configError } = await supabase
      .from('daily_coin_config')
      .select('*')
      .single();

    if (configError) {
      console.error('Erro ao buscar configuração:', configError);
      // Se não encontrar configuração, usar padrões
      const enabled = false;
      console.log('Distribuição diária não está configurada');
      return new Response(
        JSON.stringify({ success: false, message: 'Distribuição não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se está habilitado
    if (!dailyConfig.enabled) {
      console.log('Distribuição diária não está habilitada');
      return new Response(
        JSON.stringify({ success: false, message: 'Distribuição não habilitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = dailyConfig.amount || 10;
    const targetRole = dailyConfig.target_role || 'student';

    // Verificar dia da semana
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.

    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    const todayKey = dayMap[dayOfWeek];
    
    if (!dailyConfig[todayKey]) {
      console.log(`Hoje (${todayKey}) não é um dia de distribuição`);
      return new Response(
        JSON.stringify({ success: false, message: 'Não é dia de distribuição' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuários elegíveis
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, coins')
      .eq('role', targetRole);

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    console.log(`Distribuindo ${amount} moedas para ${users?.length || 0} usuários`);

    const results = [];
    const todayDate = today.toISOString().split('T')[0];

    for (const user of users || []) {
      try {
        // Adicionar moedas usando RPC para garantir atomicidade
        const { data: updatedProfile, error: updateError } = await supabase.rpc(
          'increment_coins',
          { user_id: user.id, amount: amount }
        );

        if (updateError) {
          console.error(`Erro ao atualizar moedas do usuário ${user.id}:`, updateError);
          results.push({ user_id: user.id, success: false, error: updateError.message });
          continue;
        }

        // Criar notificação
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Moedas Diárias',
          message: `Você recebeu ${amount} IFCoins hoje!`,
          type: 'daily_coins'
        });

        console.log(`Distribuído ${amount} moedas para ${user.name}`);
        results.push({ user_id: user.id, success: true, amount: amount });
      } catch (error: any) {
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