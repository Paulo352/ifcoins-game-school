import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const AdminToolsSchema = z.object({
  action: z.enum([
    'backup_database',
    'export_data',
    'cleanup_logs',
    'maintenance_mode',
    'schedule_maintenance',
    'cancel_scheduled_maintenance',
    'send_test_email'
  ]),
  enabled: z.boolean().optional(),
  message: z.string().max(500).optional(),
  to_email: z.string().email('Invalid email format').optional(),
  scheduled_at: z.string().datetime().optional()
});

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

    // Validate input
    const body = await req.json();
    const validation = AdminToolsSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = validation.data;
    console.log('Admin tools action:', action, params);

    switch (action) {
      case 'backup_database':
        return await handleBackupDatabase();
      case 'export_data':
        return await handleExportData();
      case 'cleanup_logs':
        return await handleCleanupLogs();
      case 'maintenance_mode':
        return await handleMaintenanceMode(params.enabled!, params.message!);
      case 'schedule_maintenance':
        return await handleScheduleMaintenance(params.scheduled_at!, params.message!);
      case 'cancel_scheduled_maintenance':
        try {
          const { error } = await supabase
            .from('admin_config')
            .delete()
            .eq('config_key', 'maintenance_scheduled_at');
          if (error) throw error;
          return new Response(
            JSON.stringify({ success: true, message: 'Agendamento de manutenção cancelado' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error: any) {
          console.error('Erro ao cancelar agendamento de manutenção:', error);
          return new Response(
            JSON.stringify({ error: 'Erro ao cancelar agendamento: ' + error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      case 'send_test_email':
        return await handleSendTestEmail(params.to_email!);
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  async function handleBackupDatabase() {
    try {
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

      const backupMetadata = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        total_tables: tables.length
      };

      const fullBackup = {
        metadata: backupMetadata,
        data: backupData
      };

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
        JSON.stringify({ error: 'Erro ao fazer backup' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleExportData() {
    try {
      console.log('Exporting system data...');
      
      const exportData: any = {};

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

      const { data: rewardStats } = await supabase
        .from('reward_logs')
        .select('coins, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      exportData.activity_statistics = {
        rewards_last_30_days: rewardStats?.length || 0,
        coins_distributed_last_30_days: rewardStats?.reduce((sum, reward) => sum + (reward.coins || 0), 0) || 0
      };

      const timestamp = Date.now();
      const fileName = `system_export_${new Date().toISOString().split('T')[0]}_${timestamp}.json`;
      const exportJson = JSON.stringify(exportData, null, 2);

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(`exports/${fileName}`, exportJson, {
          contentType: 'application/json',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Failed to export data: ${uploadError.message}`);
      }

      console.log(`Export completed successfully: ${fileName}`);

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
        JSON.stringify({ error: 'Erro ao exportar dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleCleanupLogs() {
    try {
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
        JSON.stringify({ error: 'Erro ao limpar logs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleMaintenanceMode(enabled: boolean, message: string) {
    try {
      const { error: maintenanceError } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: 'maintenance_mode', 
          config_value: enabled.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

      if (maintenanceError) throw maintenanceError;

      const { error: messageError } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: 'maintenance_message', 
          config_value: message,
          updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

      if (messageError) throw messageError;

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
        JSON.stringify({ error: 'Erro ao alterar modo manutenção' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function handleScheduleMaintenance(scheduledAt: string, message: string) {
    try {
      const { error } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: 'maintenance_scheduled_at', 
          config_value: scheduledAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });

      if (error) throw error;

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
        JSON.stringify({ error: 'Erro ao agendar manutenção' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  async function notifyUsersAboutMaintenance(message: string) {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin');

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('Nenhum usuário para notificar');
        return;
      }

      console.log(`Enviando notificações para ${users.length} usuários`);
      
      const notifications = users.map(user => ({
        user_id: user.id,
        title: 'Sistema em Manutenção',
        message: `O sistema IFPR Cards está em manutenção. ${message}`,
        type: 'warning'
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Erro ao criar notificações:', notificationError);
        throw notificationError;
      }

      console.log(`${notifications.length} notificações de manutenção criadas com sucesso`);
    } catch (error) {
      console.error('Erro ao notificar usuários sobre manutenção:', error);
      throw error;
    }
  }

  async function notifyUsersAboutScheduledMaintenance(scheduledAt: string, message: string) {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin');

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('Nenhum usuário para notificar sobre agendamento');
        return;
      }

      const scheduledDate = new Date(scheduledAt).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log(`Criando notificações de agendamento para ${users.length} usuários`);

      const immediateNotifications = users.map(user => ({
        user_id: user.id,
        title: 'Manutenção Agendada',
        message: `Uma manutenção foi agendada para ${scheduledDate}. ${message}`,
        type: 'info'
      }));

      const { error: immediateError } = await supabase
        .from('notifications')
        .insert(immediateNotifications);

      if (immediateError) {
        console.error('Erro ao criar notificações imediatas:', immediateError);
        throw immediateError;
      }

      const maintenanceDate = new Date(scheduledAt);
      const reminderDate = new Date(maintenanceDate.getTime() - 24 * 60 * 60 * 1000);
      
      if (reminderDate > new Date()) {
        const { error: scheduleError } = await supabase
          .from('scheduled_notifications')
          .insert({
            notification_type: 'maintenance_reminder',
            scheduled_for: reminderDate.toISOString(),
            title: 'Lembrete: Manutenção em 24h',
            message: `A manutenção agendada para ${scheduledDate} começará em 24 horas. ${message}`,
            metadata: { maintenance_at: scheduledAt, original_message: message }
          });

        if (scheduleError) {
          console.error('Erro ao agendar lembrete:', scheduleError);
        } else {
          console.log('Lembrete 24h agendado com sucesso');
        }
      }

      console.log(`${immediateNotifications.length} notificações de agendamento criadas`);
    } catch (error) {
      console.error('Erro ao notificar usuários sobre agendamento:', error);
      throw error;
    }
  }

  async function handleSendTestEmail(toEmail: string) {
    try {
      const fromEmail = Deno.env.get('MAINTENANCE_FROM_EMAIL') || 'onboarding@resend.dev';
      console.log(`Enviando email de teste para ${toEmail} de: ${fromEmail}`);

      if (!resend) {
        throw new Error('Resend não foi inicializado corretamente');
      }

      const { data, error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: 'Teste de Email - IFPR Cards',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Teste de Email</h2>
            <p>Este é um email de teste enviado pelo sistema IFPR Cards.</p>
            <p>Se você recebeu este email, a configuração do serviço de email está funcionando.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Enviado em: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `
      });

      if (emailError) {
        console.error('Erro ao enviar email de teste:', emailError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Erro ao enviar email de teste' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Email de teste enviado com sucesso:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email de teste enviado com sucesso',
          email_id: data?.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar email de teste' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  } catch (error: any) {
    console.error('Error in admin-tools function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
