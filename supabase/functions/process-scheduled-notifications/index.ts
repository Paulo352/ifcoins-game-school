import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processando notificações agendadas...');

    // Buscar notificações que devem ser executadas agora
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('executed', false)
      .lte('scheduled_for', new Date().toISOString());

    if (fetchError) {
      console.error('Erro ao buscar notificações agendadas:', fetchError);
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('Nenhuma notificação agendada para processar');
      return new Response(
        JSON.stringify({ message: 'Nenhuma notificação para processar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${scheduledNotifications.length} notificações agendadas`);

    for (const scheduled of scheduledNotifications) {
      try {
        if (scheduled.notification_type === 'maintenance_reminder') {
          // Buscar todos os usuários não-admin
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .neq('role', 'admin');

          if (usersError) {
            console.error('Erro ao buscar usuários:', usersError);
            continue;
          }

          if (users && users.length > 0) {
            // Criar notificações para todos os usuários
            const notifications = users.map(user => ({
              user_id: user.id,
              title: scheduled.title,
              message: scheduled.message,
              type: 'warning'
            }));

            const { error: notificationError } = await supabase
              .from('notifications')
              .insert(notifications);

            if (notificationError) {
              console.error('Erro ao criar notificações:', notificationError);
              continue;
            }

            console.log(`${notifications.length} notificações de lembrete criadas`);
          }
        }

        // Marcar como executado
        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({ executed: true })
          .eq('id', scheduled.id);

        if (updateError) {
          console.error('Erro ao marcar notificação como executada:', updateError);
        }

      } catch (error) {
        console.error(`Erro ao processar notificação ${scheduled.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${scheduledNotifications.length} notificações processadas` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro geral ao processar notificações:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar notificações: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});