import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verificar se o usuário é admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { action } = await req.json()

    switch (action) {
      case 'backup': {
        console.log('Starting database backup...')
        
        // Exportar dados das principais tabelas
        const tables = ['profiles', 'cards', 'user_cards', 'events', 'reward_logs', 'polls', 'poll_options', 'poll_votes', 'trades', 'admin_config']
        const backupData: any = {}

        for (const table of tables) {
          try {
            const { data, error } = await supabaseClient
              .from(table)
              .select('*')
            
            if (error) {
              console.error(`Error backing up ${table}:`, error)
              backupData[table] = { error: error.message }
            } else {
              backupData[table] = data
              console.log(`Backed up ${data?.length || 0} records from ${table}`)
            }
          } catch (err) {
            console.error(`Exception backing up ${table}:`, err)
            backupData[table] = { error: String(err) }
          }
        }

        // Adicionar metadados do backup
        const backupMetadata = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          user_id: user.id,
          total_tables: tables.length
        }

        const fullBackup = {
          metadata: backupMetadata,
          data: backupData
        }

        // Salvar backup no storage
        const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
        const backupJson = JSON.stringify(fullBackup, null, 2)
        
        const { error: uploadError } = await supabaseClient.storage
          .from('backups')
          .upload(fileName, backupJson, {
            contentType: 'application/json'
          })

        if (uploadError) {
          throw new Error(`Failed to upload backup: ${uploadError.message}`)
        }

        console.log(`Backup completed successfully: ${fileName}`)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Backup realizado com sucesso',
            fileName,
            tables: Object.keys(backupData).length,
            timestamp: backupMetadata.timestamp
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'export_data': {
        console.log('Exporting system data...')
        
        // Exportar dados resumidos para análise
        const exportData: any = {}

        // Estatísticas de usuários
        const { data: userStats } = await supabaseClient
          .from('profiles')
          .select('role, coins, created_at')

        exportData.user_statistics = {
          total_users: userStats?.length || 0,
          by_role: userStats?.reduce((acc: any, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1
            return acc
          }, {}),
          total_coins: userStats?.reduce((sum, user) => sum + (user.coins || 0), 0) || 0
        }

        // Estatísticas de cartas
        const { data: cardStats } = await supabaseClient
          .from('cards')
          .select('rarity, price, available')

        exportData.card_statistics = {
          total_cards: cardStats?.length || 0,
          by_rarity: cardStats?.reduce((acc: any, card) => {
            acc[card.rarity] = (acc[card.rarity] || 0) + 1
            return acc
          }, {}),
          available_cards: cardStats?.filter(c => c.available).length || 0
        }

        // Estatísticas de atividade
        const { data: rewardStats } = await supabaseClient
          .from('reward_logs')
          .select('coins, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        exportData.activity_statistics = {
          rewards_last_30_days: rewardStats?.length || 0,
          coins_distributed_last_30_days: rewardStats?.reduce((sum, reward) => sum + (reward.coins || 0), 0) || 0
        }

        const fileName = `system_export_${new Date().toISOString().split('T')[0]}.json`
        const exportJson = JSON.stringify(exportData, null, 2)

        const { error: uploadError } = await supabaseClient.storage
          .from('backups')
          .upload(`exports/${fileName}`, exportJson, {
            contentType: 'application/json'
          })

        if (uploadError) {
          throw new Error(`Failed to export data: ${uploadError.message}`)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Dados exportados com sucesso',
            fileName,
            export: exportData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'clean_logs': {
        console.log('Cleaning old logs...')
        
        // Limpar logs de segurança mais antigos que 90 dias
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        
        const { data: deletedLogs, error: deleteError } = await supabaseClient
          .from('security_logs')
          .delete()
          .lt('created_at', cutoffDate)
          .select('id')

        if (deleteError) {
          throw new Error(`Failed to clean logs: ${deleteError.message}`)
        }

        console.log(`Cleaned ${deletedLogs?.length || 0} old security logs`)

        return new Response(
          JSON.stringify({
            success: true,
            message: `${deletedLogs?.length || 0} logs antigos foram removidos`,
            cleaned_logs: deletedLogs?.length || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'system_stats': {
        console.log('Generating system statistics...')
        
        // Coletar estatísticas em tempo real
        const stats: any = {}

        // Contagens básicas
        const tables = ['profiles', 'cards', 'user_cards', 'events', 'polls', 'trades', 'reward_logs']
        for (const table of tables) {
          const { count } = await supabaseClient
            .from(table)
            .select('*', { count: 'exact', head: true })
          stats[`${table}_count`] = count || 0
        }

        // Estatísticas de storage
        const { data: storageStats } = await supabaseClient.storage
          .from('backups')
          .list()

        stats.backup_files = storageStats?.length || 0

        // Configurações do sistema
        const { data: configs } = await supabaseClient
          .from('admin_config')
          .select('config_key, config_value')

        stats.system_config = configs?.reduce((acc: any, config) => {
          acc[config.config_key] = config.config_value
          return acc
        }, {}) || {}

        return new Response(
          JSON.stringify({
            success: true,
            stats,
            generated_at: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin tools error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})