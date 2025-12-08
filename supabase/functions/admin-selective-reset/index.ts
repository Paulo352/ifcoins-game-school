import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_OPTIONS = [
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
] as const;

type ResetOption = typeof VALID_OPTIONS[number];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
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
      console.error('User not admin:', { user_id: user.id, role: profile?.role, profileError });
      
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

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Invalid JSON body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { options, confirmation } = body;

    if (confirmation !== 'RESETAR') {
      return new Response(
        JSON.stringify({ error: 'Confirmation text must be "RESETAR"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(options) || options.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Options must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all options
    const invalidOptions = options.filter((opt: string) => !VALID_OPTIONS.includes(opt as ResetOption));
    if (invalidOptions.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid options: ${invalidOptions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { step: string; status: 'success' | 'error'; error?: string }[] = [];

    // Log admin action
    await supabase.from('security_logs').insert({
      user_id: user.id,
      action: 'selective_reset_executed',
      metadata: { options, timestamp: new Date().toISOString() }
    });

    console.log('Starting selective reset with options:', options);

    // Helper function to safely delete from a table
    const safeDelete = async (tableName: string, condition?: { column: string, operator: string, value: any }) => {
      try {
        let query = supabase.from(tableName).delete();
        
        if (condition) {
          if (condition.operator === 'neq') {
            query = query.neq(condition.column, condition.value);
          } else if (condition.operator === 'in') {
            query = query.in(condition.column, condition.value);
          } else if (condition.operator === 'is') {
            query = query.is(condition.column, condition.value);
          } else if (condition.operator === 'not.is') {
            query = query.not(condition.column, 'is', condition.value);
          }
        } else {
          // Delete all records - use gte for id as uuid comparison
          query = query.gte('id', '00000000-0000-0000-0000-000000000000');
        }
        
        const { error } = await query;
        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e) {
        console.error(`Exception deleting from ${tableName}:`, e);
        return { success: false, error: String(e) };
      }
    };

    // Helper function to safely update a table
    const safeUpdate = async (tableName: string, data: Record<string, any>) => {
      try {
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .gte('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.error(`Error updating ${tableName}:`, error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e) {
        console.error(`Exception updating ${tableName}:`, e);
        return { success: false, error: String(e) };
      }
    };

    for (const action of options as ResetOption[]) {
      try {
        switch (action) {
          case 'reset_bank': {
            await safeDelete('loan_payments');
            await safeDelete('loans');
            const updateResult = await safeUpdate('bank', { total_coins: 10000, coins_in_circulation: 0 });
            results.push({ 
              step: 'IFBank (Sistema Bancário)', 
              status: updateResult.success ? 'success' : 'error',
              error: updateResult.error
            });
            break;
          }

          case 'delete_events': {
            // Get event polls first
            const { data: eventPolls } = await supabase
              .from('polls')
              .select('id')
              .not('event_id', 'is', null);
            
            if (eventPolls && eventPolls.length > 0) {
              const pollIds = eventPolls.map(p => p.id);
              await safeDelete('poll_votes', { column: 'poll_id', operator: 'in', value: pollIds });
              await safeDelete('poll_options', { column: 'poll_id', operator: 'in', value: pollIds });
            }
            await supabase.from('polls').delete().not('event_id', 'is', null);
            await safeDelete('event_cards');
            const eventsResult = await safeDelete('events');
            results.push({ 
              step: 'Eventos Completos', 
              status: eventsResult.success ? 'success' : 'error',
              error: eventsResult.error
            });
            break;
          }

          case 'delete_packs': {
            await safeDelete('pack_purchases');
            await safeDelete('pack_cards');
            const packsResult = await safeDelete('packs');
            results.push({ 
              step: 'Sistema de Pacotes', 
              status: packsResult.success ? 'success' : 'error',
              error: packsResult.error
            });
            break;
          }

          case 'delete_quizzes': {
            // Delete quiz-related data in correct order
            await safeDelete('power_up_usage');
            await safeDelete('quiz_room_chat');
            await safeDelete('quiz_room_players');
            await safeDelete('multiplayer_match_history');
            await safeDelete('quiz_rooms');
            await safeDelete('quiz_answers');
            await safeDelete('quiz_attempts');
            await safeDelete('quiz_classes');
            await safeDelete('quiz_questions');
            
            // Need to handle quizzes with reward_card_id FK
            const { error: updateError } = await supabase
              .from('quizzes')
              .update({ reward_card_id: null })
              .gte('id', '00000000-0000-0000-0000-000000000000');
            
            if (updateError) {
              console.log('Could not nullify reward_card_id:', updateError);
            }
            
            const quizzesResult = await safeDelete('quizzes');
            results.push({ 
              step: 'Sistema de Quizzes', 
              status: quizzesResult.success ? 'success' : 'error',
              error: quizzesResult.error
            });
            break;
          }

          case 'delete_polls': {
            // Delete independent polls only (no event_id)
            const { data: independentPolls } = await supabase
              .from('polls')
              .select('id')
              .is('event_id', null);
            
            if (independentPolls && independentPolls.length > 0) {
              const pollIds = independentPolls.map(p => p.id);
              await safeDelete('poll_votes', { column: 'poll_id', operator: 'in', value: pollIds });
              await safeDelete('poll_options', { column: 'poll_id', operator: 'in', value: pollIds });
              const { error } = await supabase.from('polls').delete().in('id', pollIds);
              results.push({ 
                step: 'Votações (Polls)', 
                status: error ? 'error' : 'success',
                error: error?.message
              });
            } else {
              results.push({ step: 'Votações (Polls)', status: 'success' });
            }
            break;
          }

          case 'delete_user_cards': {
            const userCardsResult = await safeDelete('user_cards');
            results.push({ 
              step: 'Cartas dos Usuários', 
              status: userCardsResult.success ? 'success' : 'error',
              error: userCardsResult.error
            });
            break;
          }

          case 'delete_cards': {
            // Delete cards with dependencies first
            await safeDelete('user_cards');
            await safeDelete('pack_cards');
            await safeDelete('event_cards');
            await safeDelete('exclusive_card_history');
            await safeDelete('market_listings');
            await safeDelete('user_card_achievements');
            await safeDelete('card_achievements');
            await safeDelete('trades');
            
            // Nullify reward_card_id in quizzes before deleting cards
            await supabase
              .from('quizzes')
              .update({ reward_card_id: null })
              .gte('id', '00000000-0000-0000-0000-000000000000');
            
            const cardsResult = await safeDelete('cards');
            results.push({ 
              step: 'Cartas do Sistema', 
              status: cardsResult.success ? 'success' : 'error',
              error: cardsResult.error
            });
            break;
          }

          case 'reset_coins': {
            const coinsResult = await safeUpdate('profiles', { coins: 100 });
            results.push({ 
              step: 'Moedas dos Usuários', 
              status: coinsResult.success ? 'success' : 'error',
              error: coinsResult.error
            });
            break;
          }

          case 'delete_reward_logs': {
            const rewardLogsResult = await safeDelete('reward_logs');
            results.push({ 
              step: 'Histórico de Recompensas', 
              status: rewardLogsResult.success ? 'success' : 'error',
              error: rewardLogsResult.error
            });
            break;
          }

          case 'delete_trades': {
            const tradesResult = await safeDelete('trades');
            results.push({ 
              step: 'Trocas', 
              status: tradesResult.success ? 'success' : 'error',
              error: tradesResult.error
            });
            break;
          }

          case 'delete_pack_purchases': {
            const purchasesResult = await safeDelete('pack_purchases');
            results.push({ 
              step: 'Histórico de Compras', 
              status: purchasesResult.success ? 'success' : 'error',
              error: purchasesResult.error
            });
            break;
          }

          case 'delete_notifications': {
            await safeDelete('notifications');
            const notificationsResult = await safeDelete('achievement_notifications');
            results.push({ 
              step: 'Notificações', 
              status: notificationsResult.success ? 'success' : 'error',
              error: notificationsResult.error
            });
            break;
          }

          case 'delete_multiplayer': {
            await safeDelete('power_up_usage');
            await safeDelete('quiz_room_chat');
            await safeDelete('quiz_room_players');
            await safeDelete('multiplayer_match_history');
            const multiplayerResult = await safeDelete('quiz_rooms');
            results.push({ 
              step: 'Sistema Multiplayer', 
              status: multiplayerResult.success ? 'success' : 'error',
              error: multiplayerResult.error
            });
            break;
          }

          case 'delete_mentorships': {
            await safeDelete('mentorship_activities');
            await safeDelete('mentorship_reviews');
            const mentorshipsResult = await safeDelete('mentorships');
            results.push({ 
              step: 'Sistema de Mentoria', 
              status: mentorshipsResult.success ? 'success' : 'error',
              error: mentorshipsResult.error
            });
            break;
          }

          case 'delete_classes': {
            await safeDelete('class_messages');
            await safeDelete('class_students');
            await safeDelete('class_invites');
            
            // Need to handle quiz_classes and quiz_rooms with class_id FK
            await safeDelete('quiz_classes');
            await supabase
              .from('quiz_rooms')
              .update({ class_id: null })
              .gte('id', '00000000-0000-0000-0000-000000000000');
            await supabase
              .from('quizzes')
              .update({ class_id: null })
              .gte('id', '00000000-0000-0000-0000-000000000000');
            
            const classesResult = await safeDelete('classes');
            results.push({ 
              step: 'Sistema de Turmas', 
              status: classesResult.success ? 'success' : 'error',
              error: classesResult.error
            });
            break;
          }

          case 'delete_badges': {
            await safeDelete('user_quiz_badges');
            await safeDelete('user_custom_badges');
            await safeDelete('user_badge_progress');
            await safeDelete('user_ranks');
            const badgesResult = await safeDelete('custom_badges');
            results.push({ 
              step: 'Sistema de Badges', 
              status: badgesResult.success ? 'success' : 'error',
              error: badgesResult.error
            });
            break;
          }

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
      JSON.stringify({ error: 'Failed to execute selective reset', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});