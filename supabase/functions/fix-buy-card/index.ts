
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Corrigir a função buy_card para evitar ambiguidade
    const { error } = await supabaseClient.rpc('execute_sql', {
      query: `
        CREATE OR REPLACE FUNCTION public.buy_card(card_id uuid, user_id uuid)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO ''
        AS $function$
        DECLARE
          v_card_id UUID := card_id;
          v_user_id UUID := user_id;
          v_card_price INTEGER;
          v_card_available BOOLEAN;
          v_copies_left INTEGER;
          v_profile_rec public.profiles%ROWTYPE;
          v_rows_updated INTEGER;
        BEGIN
          -- Auth guard: user can only buy for themselves
          IF auth.uid() IS NULL OR auth.uid() <> v_user_id THEN
            RETURN json_build_object('success', false, 'error', 'Acesso não autorizado');
          END IF;

          -- Get card info
          SELECT c.price, c.available, c.copies_available 
          INTO v_card_price, v_card_available, v_copies_left
          FROM public.cards c
          WHERE c.id = v_card_id;

          IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Carta não encontrada');
          END IF;

          IF NOT v_card_available THEN
            RETURN json_build_object('success', false, 'error', 'Carta não está disponível');
          END IF;

          -- If copies are limited, ensure there's at least 1 left
          IF v_copies_left IS NOT NULL AND v_copies_left <= 0 THEN
            RETURN json_build_object('success', false, 'error', 'Não há cópias disponíveis');
          END IF;

          -- Get user profile with alias
          SELECT p.* INTO v_profile_rec
          FROM public.profiles p
          WHERE p.id = v_user_id;

          IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'error', 'Perfil de usuário não encontrado');
          END IF;

          IF v_profile_rec.coins < v_card_price THEN
            RETURN json_build_object('success', false, 'error', 'Moedas insuficientes');
          END IF;

          -- Deduct coins with alias
          UPDATE public.profiles p
          SET coins = p.coins - v_card_price,
              updated_at = now()
          WHERE p.id = v_user_id;

          -- Try to update existing user_cards row with aliases
          UPDATE public.user_cards uc
          SET quantity = uc.quantity + 1
          WHERE uc.user_id = v_user_id AND uc.card_id = v_card_id;
          GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

          -- If no row was updated, insert a new one
          IF v_rows_updated = 0 THEN
            INSERT INTO public.user_cards (user_id, card_id, quantity)
            VALUES (v_user_id, v_card_id, 1);
          END IF;

          -- Decrease available copies (only if not unlimited) with alias
          IF v_copies_left IS NOT NULL THEN
            UPDATE public.cards c
            SET copies_available = GREATEST(c.copies_available - 1, 0),
                updated_at = now()
            WHERE c.id = v_card_id;
          END IF;

          RETURN json_build_object('success', true, 'message', 'Carta comprada com sucesso');
        EXCEPTION
          WHEN OTHERS THEN
            -- Basic error capture to avoid exposing internal details
            RETURN json_build_object('success', false, 'error', COALESCE(SQLERRM, 'Erro interno na compra'));
        END;
        $function$
      `
    })

    if (error) {
      console.error('Erro ao corrigir função:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
