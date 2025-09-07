import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...params } = await req.json();
    console.log('Admin tools action:', action, params);

    switch (action) {
      case 'backup_database':
        return await handleBackupDatabase();
      case 'export_data':
        return await handleExportData();
      case 'cleanup_logs':
        return await handleCleanupLogs();
      case 'maintenance_mode':
        return await handleMaintenanceMode(params.enabled, params.message);
      case 'schedule_maintenance':
        return await handleScheduleMaintenance(params.scheduled_at, params.message);
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  async function handleBackupDatabase() {
    try {
      // Exportar dados das principais tabelas
      const tables = ['profiles', 'cards', 'user_cards', 'events', 'reward_logs', 'polls', 'poll_options', 'poll_votes', 'trades', 'admin_config'];
      const backupData: any = {};

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');
          
          if (error) {
            console.error(`Error backing up ${table}:`, error);
            backupData[table] = { error: error.message };
          } else {
            backupData[table] = data;
            console.log(`Backed up ${data?.length || 0} records from ${table}`);
          }
        } catch (err) {
          console.error(`Exception backing up ${table}:`, err);
          backupData[table] = { error: String(err) };
        }
      }

      // Adicionar metadados do backup
      const backupMetadata = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        total_tables: tables.length
      };

      const fullBackup = {
        metadata: backupMetadata,
        data: backupData
      };

      // Salvar backup no storage
      const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      const backupJson = JSON.stringify(fullBackup, null, 2);
      
      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(fileName, backupJson, {
          contentType: 'application/json'
        });

      if (uploadError) {
        throw new Error(`Failed to upload backup: ${uploadError.message}`);
      }

      console.log(`Backup completed successfully: ${fileName}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Backup realizado com sucesso',
          fileName,
          tables: Object.keys(backupData).length,
          timestamp: backupMetadata.timestamp
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erro ao fazer backup:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer backup: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleExportData() {
    try {
      console.log('Exporting system data...');
      
      // Exportar dados resumidos para análise
      const exportData: any = {};

      // Estatísticas de usuários
      const { data: userStats } = await supabase
        .from('profiles')
        .select('role, coins, created_at');

      exportData.user_statistics = {
        total_users: userStats?.length || 0,
        by_role: userStats?.reduce((acc: any, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        total_coins: userStats?.reduce((sum, user) => sum + (user.coins || 0), 0) || 0
      };

      // Estatísticas de cartas
      const { data: cardStats } = await supabase
        .from('cards')
        .select('rarity, price, available');

      exportData.card_statistics = {
        total_cards: cardStats?.length || 0,
        by_rarity: cardStats?.reduce((acc: any, card) => {
          acc[card.rarity] = (acc[card.rarity] || 0) + 1;
          return acc;
        }, {}),
        available_cards: cardStats?.filter(c => c.available).length || 0
      };

      // Estatísticas de atividade
      const { data: rewardStats } = await supabase
        .from('reward_logs')
        .select('coins, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      exportData.activity_statistics = {
        rewards_last_30_days: rewardStats?.length || 0,
        coins_distributed_last_30_days: rewardStats?.reduce((sum, reward) => sum + (reward.coins || 0), 0) || 0
      };

      const fileName = `system_export_${new Date().toISOString().split('T')[0]}.json`;
      const exportJson = JSON.stringify(exportData, null, 2);

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(`exports/${fileName}`, exportJson, {
          contentType: 'application/json'
        });

      if (uploadError) {
        throw new Error(`Failed to export data: ${uploadError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dados exportados com sucesso',
          fileName,
          export: exportData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao exportar dados: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleCleanupLogs() {
    try {
      // Limpar logs antigos (mais de 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error: rewardLogsError } = await supabase
        .from('reward_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (rewardLogsError) throw rewardLogsError;

      const { error: securityLogsError } = await supabase
        .from('security_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (securityLogsError) throw securityLogsError;

      console.log('Logs antigos removidos com sucesso');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Logs antigos removidos com sucesso',
          cleaned_before: thirtyDaysAgo.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erro ao limpar logs:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao limpar logs: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleMaintenanceMode(enabled: boolean, message: string) {
    try {
      // Atualizar configuração de manutenção
      const { error: maintenanceError } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: 'maintenance_mode', 
          config_value: enabled.toString(),
          updated_at: new Date().toISOString()
        });

      if (maintenanceError) throw maintenanceError;

      const { error: messageError } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: 'maintenance_message', 
          config_value: message,
          updated_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Se ativando manutenção, enviar emails para usuários
      if (enabled) {
        await notifyUsersAboutMaintenance(message);
      }

      console.log(`Modo manutenção ${enabled ? 'ativado' : 'desativado'}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Modo manutenção ${enabled ? 'ativado' : 'desativado'} com sucesso`,
          maintenance_enabled: enabled
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erro ao alterar modo manutenção:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao alterar modo manutenção: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleScheduleMaintenance(scheduledAt: string, message: string) {
    try {
      // Salvar agendamento
      const { error } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: 'maintenance_scheduled_at', 
          config_value: scheduledAt,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Enviar emails de notificação
      await notifyUsersAboutScheduledMaintenance(scheduledAt, message);

      console.log('Manutenção agendada e usuários notificados');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Manutenção agendada e usuários notificados com sucesso',
          scheduled_at: scheduledAt
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erro ao agendar manutenção:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao agendar manutenção: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function notifyUsersAboutMaintenance(message: string) {
    try {
      // Buscar emails de usuários não-admin
      const { data: users, error } = await supabase
        .from('profiles')
        .select('email')
        .neq('role', 'admin');

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('Nenhum usuário para notificar');
        return;
      }

      const emails = users.map(user => user.email).filter(Boolean);
      
      if (emails.length === 0) {
        console.log('Nenhum email válido encontrado');
        return;
      }

      // Obter email remetente configurado
      const fromEmail = Deno.env.get('MAINTENANCE_FROM_EMAIL') || 'IFPR Cards <onboarding@resend.dev>';
      
      console.log(`Enviando emails para ${emails.length} usuários de: ${fromEmail}`);
      
      // Enviar email em lote
      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: emails,
        subject: 'Sistema em Manutenção - IFPR Cards',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Sistema em Manutenção</h2>
            <p>Olá!</p>
            <p>Informamos que o sistema IFPR Cards entrará em manutenção.</p>
            <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p><strong>Mensagem:</strong> ${message}</p>
            </div>
            <p>Pedimos desculpas pelo transtorno e agradecemos sua compreensão.</p>
            <p>Você será notificado quando o sistema voltar ao normal.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Atenciosamente,<br>
              Equipe IFPR Cards
            </p>
          </div>
        `
      });

      if (emailError) {
        console.error('Erro ao enviar emails:', emailError);
        console.error('Detalhes do erro:', JSON.stringify(emailError));
        // Não falhar silenciosamente - logar erro mas continuar
        throw new Error(`Falha ao enviar emails: ${emailError.message || JSON.stringify(emailError)}`);
      } else {
        console.log(`Emails de manutenção enviados para ${emails.length} usuários`);
      }
    } catch (error) {
      console.error('Erro ao notificar usuários sobre manutenção:', error);
    }
  }

  async function notifyUsersAboutScheduledMaintenance(scheduledAt: string, message: string) {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('email')
        .neq('role', 'admin');

      if (error) throw error;

      if (!users || users.length === 0) return;

      const emails = users.map(user => user.email).filter(Boolean);
      if (emails.length === 0) return;

      const scheduledDate = new Date(scheduledAt).toLocaleString('pt-BR');
      const fromEmail = Deno.env.get('MAINTENANCE_FROM_EMAIL') || 'IFPR Cards <onboarding@resend.dev>';
      
      console.log(`Enviando emails de agendamento para ${emails.length} usuários de: ${fromEmail}`);

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: emails,
        subject: 'Manutenção Agendada - IFPR Cards',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Manutenção Agendada</h2>
            <p>Olá!</p>
            <p>Informamos que uma manutenção foi agendada para o sistema IFPR Cards.</p>
            <div style="background-color: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p><strong>Data e Hora:</strong> ${scheduledDate}</p>
              <p><strong>Mensagem:</strong> ${message}</p>
            </div>
            <p>Durante este período, o sistema poderá ficar indisponível.</p>
            <p>Agradecemos sua compreensão.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Atenciosamente,<br>
              Equipe IFPR Cards
            </p>
          </div>
        `
      });

      if (emailError) {
        console.error('Erro ao enviar emails de agendamento:', emailError);
        console.error('Detalhes do erro:', JSON.stringify(emailError));
        // Não falhar silenciosamente - logar erro mas continuar
        throw new Error(`Falha ao enviar emails de agendamento: ${emailError.message || JSON.stringify(emailError)}`);
      } else {
        console.log(`Emails de agendamento enviados para ${emails.length} usuários`);
      }
    } catch (error) {
      console.error('Erro ao notificar usuários sobre agendamento:', error);
    }
  }

  } catch (error: any) {
    console.error('Admin tools error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});