import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ResetOptionsSchema = z.object({
  options: z.array(z.enum([
    'reset_bank',
    'delete_events',
    'delete_packs',
    'delete_quizzes',
    'delete_polls',
    'delete_user_cards',
    'delete_cards',
    'reset_coins',
    'delete_reward_logs',
    'delete_trades',
    'delete_pack_purchases',
    'delete_notifications',
    'delete_multiplayer',
    'delete_mentorships',
    'delete_classes',
    'delete_badges'
  ])),
  confirmation: z.literal('RESETAR')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('User not admin:', { user_id: user.id, profileError });
      
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'selective_reset_unauthorized_attempt',
        metadata: { email: user.email, timestamp: new Date().toISOString() }
      });

      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validation = ResetOptionsSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('Invalid input:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: validation.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { options } = validation.data;
    const results: { step: string; status: 'success' | 'error'; error?: string }[] = [];

    // Log admin action
    await supabase.from('security_logs').insert({
      user_id: user.id,
      action: 'selective_reset_executed',
      metadata: { options, timestamp: new Date().toISOString() }
    });

    console.log('Starting selective reset with options:', options);

    for (const action of options) {
      try {
        switch (action) {
          case 'reset_bank':
            await supabase.from('loan_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('loans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('bank').update({ total_coins: 10000, coins_in_circulation: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'IFBank (Sistema Bancário)', status: 'success' });
            break;

          case 'delete_events':
            // Get event polls first
            const { data: eventPolls } = await supabase.from('polls').select('id').not('event_id', 'is', null);
            if (eventPolls && eventPolls.length > 0) {
              const pollIds = eventPolls.map(p => p.id);
              await supabase.from('poll_votes').delete().in('poll_id', pollIds);
              await supabase.from('poll_options').delete().in('poll_id', pollIds);
            }
            await supabase.from('polls').delete().not('event_id', 'is', null);
            await supabase.from('event_cards').delete().neq('event_id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Eventos Completos', status: 'success' });
            break;

          case 'delete_packs':
            await supabase.from('pack_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('pack_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('packs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Sistema de Pacotes', status: 'success' });
            break;

          case 'delete_quizzes':
            // Delete quiz-related data in correct order
            await supabase.from('power_up_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_room_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_room_players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('multiplayer_match_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Sistema de Quizzes', status: 'success' });
            break;

          case 'delete_polls':
            // Delete independent polls only (no event_id)
            const { data: independentPolls } = await supabase.from('polls').select('id').is('event_id', null);
            if (independentPolls && independentPolls.length > 0) {
              const pollIds = independentPolls.map(p => p.id);
              await supabase.from('poll_votes').delete().in('poll_id', pollIds);
              await supabase.from('poll_options').delete().in('poll_id', pollIds);
              await supabase.from('polls').delete().in('id', pollIds);
            }
            results.push({ step: 'Votações (Polls)', status: 'success' });
            break;

          case 'delete_user_cards':
            await supabase.from('user_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Cartas dos Usuários', status: 'success' });
            break;

          case 'delete_cards':
            // Delete cards with dependencies first
            await supabase.from('user_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('pack_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('event_cards').delete().neq('card_id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('exclusive_card_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('market_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('card_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('user_card_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Cartas do Sistema', status: 'success' });
            break;

          case 'reset_coins':
            await supabase.from('profiles').update({ coins: 100 }).neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Moedas dos Usuários', status: 'success' });
            break;

          case 'delete_reward_logs':
            await supabase.from('reward_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Histórico de Recompensas', status: 'success' });
            break;

          case 'delete_trades':
            await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Trocas', status: 'success' });
            break;

          case 'delete_pack_purchases':
            await supabase.from('pack_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Histórico de Compras', status: 'success' });
            break;

          case 'delete_notifications':
            await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('achievement_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Notificações', status: 'success' });
            break;

          case 'delete_multiplayer':
            await supabase.from('power_up_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_room_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_room_players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('multiplayer_match_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('quiz_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Sistema Multiplayer', status: 'success' });
            break;

          case 'delete_mentorships':
            await supabase.from('mentorship_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('mentorship_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('mentorships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Sistema de Mentoria', status: 'success' });
            break;

          case 'delete_classes':
            await supabase.from('class_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('class_students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('class_invites').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Sistema de Turmas', status: 'success' });
            break;

          case 'delete_badges':
            await supabase.from('user_quiz_badges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('user_custom_badges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('user_badge_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('custom_badges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            results.push({ step: 'Sistema de Badges', status: 'success' });
            break;

          default:
            results.push({ step: action, status: 'error', error: 'Ação desconhecida' });
        }
      } catch (error) {
        console.error(`Error resetting ${action}:`, error);
        results.push({ step: action, status: 'error', error: String(error) });
      }
    }

    const allSuccess = results.every(r => r.status === 'success');
    
    console.log('Selective reset completed:', results);

    return new Response(
      JSON.stringify({
        success: allSuccess,
        message: allSuccess 
          ? `Reset concluído com sucesso! ${results.length} ações executadas.`
          : 'Alguns itens falharam no reset',
        resetSteps: results,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Selective reset error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to execute selective reset' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
