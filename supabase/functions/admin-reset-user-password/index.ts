import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar autenticação do usuário que está fazendo a requisição
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.error('Acesso negado - usuário não é admin:', user.id);
      throw new Error('Apenas administradores podem alterar senhas de usuários');
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error('userId e newPassword são obrigatórios');
    }

    if (newPassword.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }

    // Buscar informações do usuário alvo
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('email, name, role')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      throw new Error('Usuário não encontrado');
    }

    // Alterar senha usando admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
    }

    // Registrar log de segurança
    await supabaseAdmin
      .from('security_logs')
      .insert({
        user_id: user.id,
        action: 'admin_password_reset',
        target_user_id: userId,
        metadata: {
          target_email: targetUser.email,
          target_name: targetUser.name,
          target_role: targetUser.role,
          admin_email: user.email
        }
      });

    console.log(`Admin ${user.email} alterou senha do usuário ${targetUser.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Senha alterada com sucesso para ${targetUser.name}`,
        user: {
          id: userId,
          email: targetUser.email,
          name: targetUser.name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na função admin-reset-user-password:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao alterar senha'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
