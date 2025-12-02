import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const DeleteUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format')
})

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verify admin role using new user_roles table
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !userRole) {
      console.error('Role check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Validate input
    const body = await req.json()
    const validation = DeleteUserSchema.safeParse(body)
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = validation.data

    // 4. Log the deletion attempt
    await supabaseAdmin.from('security_logs').insert({
      user_id: user.id,
      action: 'user_deletion_attempt',
      target_user_id: userId,
      metadata: { 
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    })

    // 5. Delete related records first to avoid FK constraints
    console.log('Deleting related records for user:', userId)
    
    // Delete user cards
    await supabaseAdmin.from('user_cards').delete().eq('user_id', userId)
    
    // Delete quiz attempts and answers
    const { data: attempts } = await supabaseAdmin.from('quiz_attempts').select('id').eq('user_id', userId)
    if (attempts && attempts.length > 0) {
      const attemptIds = attempts.map(a => a.id)
      await supabaseAdmin.from('quiz_answers').delete().in('attempt_id', attemptIds)
    }
    await supabaseAdmin.from('quiz_attempts').delete().eq('user_id', userId)
    
    // Delete user badges
    await supabaseAdmin.from('user_quiz_badges').delete().eq('user_id', userId)
    
    // Delete user ranks
    await supabaseAdmin.from('user_ranks').delete().eq('user_id', userId)
    
    // Delete loans
    await supabaseAdmin.from('loans').delete().eq('student_id', userId)
    
    // Delete transactions
    await supabaseAdmin.from('transactions').delete().eq('sender_id', userId)
    await supabaseAdmin.from('transactions').delete().eq('receiver_id', userId)
    
    // Delete reward logs
    await supabaseAdmin.from('reward_logs').delete().eq('student_id', userId)
    await supabaseAdmin.from('reward_logs').delete().eq('teacher_id', userId)
    
    // Delete trades
    await supabaseAdmin.from('trades').delete().eq('from_user_id', userId)
    await supabaseAdmin.from('trades').delete().eq('to_user_id', userId)
    
    // Delete market listings
    await supabaseAdmin.from('market_listings').delete().eq('seller_id', userId)
    
    // Delete poll votes
    await supabaseAdmin.from('poll_votes').delete().eq('user_id', userId)
    
    // Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId)
    await supabaseAdmin.from('achievement_notifications').delete().eq('user_id', userId)
    
    // Delete class students
    await supabaseAdmin.from('class_students').delete().eq('student_id', userId)
    
    // Delete mentorships
    await supabaseAdmin.from('mentorships').delete().eq('mentor_id', userId)
    await supabaseAdmin.from('mentorships').delete().eq('mentee_id', userId)
    
    // Delete security logs for this user (both as actor and target)
    await supabaseAdmin.from('security_logs').delete().eq('user_id', userId)
    await supabaseAdmin.from('security_logs').delete().eq('target_user_id', userId)
    
    // Delete user roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
    
    // Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    console.log('Related records deleted, now deleting auth user')

    // 6. Delete user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Log successful deletion
    await supabaseAdmin.from('security_logs').insert({
      user_id: user.id,
      action: 'user_deleted',
      target_user_id: userId,
      metadata: { 
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    console.log('User deleted successfully:', userId)

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
