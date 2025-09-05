
import { supabase } from '@/integrations/supabase/client';

export function useAuthActions() {
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando login para:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('Erro no login:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Tentando cadastro para:', email, 'nome:', name);
      
      // Tipo de usuário é determinado automaticamente no backend
      // baseado em configuração segura na tabela admin_config
      const getUserTypeFromEmail = (email: string) => {
        if (email.endsWith('@estudantes.ifpr.edu.br')) return 'student';
        if (email.endsWith('@ifpr.edu.br')) return 'teacher';
        // Admin será determinado no backend via configuração segura
        return 'student'; // default
      };

      const userType = getUserTypeFromEmail(email);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name.trim(),
            role: userType,
          },
        },
      });
      
      if (error) {
        console.error('Erro no cadastro:', error);
        return { error };
      }

      // Se o usuário foi criado com sucesso, criar o perfil
      if (data.user && !error) {
        console.log('Usuário criado, criando perfil...');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email.trim().toLowerCase(),
            name: name.trim(),
            role: userType,
            coins: 100, // moedas iniciais
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Não retornar erro aqui pois o usuário já foi criado
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return {
    signIn,
    signUp,
    signOut
  };
}
