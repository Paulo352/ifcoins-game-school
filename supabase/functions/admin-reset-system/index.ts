import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const ResetSystemSchema = z.object({
  confirmation: z.literal('RESETAR SISTEMA', {
    errorMap: () => ({ message: 'Confirmação inválida' })
  })
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[RESET] No authorization header')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('[RESET] Invalid token:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin via user_roles table
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !userRole) {
      console.error('[RESET] Not admin:', { user_id: user.id, roleError })
      
      // Log unauthorized reset attempt
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'system_reset_unauthorized_attempt',
        metadata: { email: user.email, timestamp: new Date().toISOString() }
      })

      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate request body
    const body = await req.json()
    const validation = ResetSystemSchema.safeParse(body)

    if (!validation.success) {
      console.error('[RESET] Invalid confirmation:', validation.error)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid confirmation text',
          required: 'RESETAR SISTEMA'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check - prevent multiple resets in short time
    const { data: recentResets } = await supabase
      .from('security_logs')
      .select('created_at')
      .eq('action', 'system_reset')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour

    if (recentResets && recentResets.length > 0) {
      console.error('[RESET] Rate limit exceeded')
      return new Response(
        JSON.stringify({ error: 'System was already reset recently. Please wait 1 hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[RESET] Admin reset initiated by:', user.id, user.email)

    // Start system reset process
    const resetSteps = []

    // Step 1: Delete all user cards
    console.log('Deleting all user cards...')
    const { error: cardsError } = await supabase
      .from('user_cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (cardsError) {
      console.error('Error deleting user cards:', cardsError)
      resetSteps.push({ step: 'user_cards', status: 'error', error: cardsError.message })
    } else {
      resetSteps.push({ step: 'user_cards', status: 'success' })
      console.log('All user cards deleted successfully')
    }

    // Step 2: Reset all user coins to 100 (default value)
    console.log('Resetting all user coins...')
    const { error: coinsError } = await supabase
      .from('profiles')
      .update({ coins: 100, updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all rows
    
    if (coinsError) {
      console.error('Error resetting coins:', coinsError)
      resetSteps.push({ step: 'reset_coins', status: 'error', error: coinsError.message })
    } else {
      resetSteps.push({ step: 'reset_coins', status: 'success' })
      console.log('All user coins reset to 100 successfully')
    }

    // Step 3: Clear reward logs (optional - keep for audit trail)
    console.log('Clearing reward logs...')
    const { error: logsError } = await supabase
      .from('reward_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (logsError) {
      console.error('Error clearing reward logs:', logsError)
      resetSteps.push({ step: 'reward_logs', status: 'error', error: logsError.message })
    } else {
      resetSteps.push({ step: 'reward_logs', status: 'success' })
      console.log('All reward logs cleared successfully')
    }

    // Step 4: Clear trades
    console.log('Clearing all trades...')
    const { error: tradesError } = await supabase
      .from('trades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (tradesError) {
      console.error('Error clearing trades:', tradesError)
      resetSteps.push({ step: 'trades', status: 'error', error: tradesError.message })
    } else {
      resetSteps.push({ step: 'trades', status: 'success' })
      console.log('All trades cleared successfully')
    }

    // Step 5: Delete all cards from the system
    console.log('Deleting all system cards...')
    const { error: systemCardsError } = await supabase
      .from('cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (systemCardsError) {
      console.error('Error deleting system cards:', systemCardsError)
      resetSteps.push({ step: 'system_cards', status: 'error', error: systemCardsError.message })
    } else {
      resetSteps.push({ step: 'system_cards', status: 'success' })
      console.log('All system cards deleted successfully')
    }

    // Log the system reset action
    const { error: securityLogError } = await supabase
      .from('security_logs')
      .insert({
        user_id: user.id,
        action: 'system_reset',
        metadata: {
          reset_steps: resetSteps,
          timestamp: new Date().toISOString(),
          total_steps: resetSteps.length,
          successful_steps: resetSteps.filter(s => s.status === 'success').length,
          failed_steps: resetSteps.filter(s => s.status === 'error').length
        }
      })

    if (securityLogError) {
      console.error('Error logging security event:', securityLogError)
    }

    const successfulSteps = resetSteps.filter(s => s.status === 'success').length
    const totalSteps = resetSteps.length

    console.log(`System reset completed: ${successfulSteps}/${totalSteps} steps successful`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sistema resetado com sucesso! ${successfulSteps}/${totalSteps} etapas concluídas.`,
        resetSteps,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('[RESET] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Operation failed' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
