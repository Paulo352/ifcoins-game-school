import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);

  const sendResetEmail = async (email: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success('Email de recuperação enviado!', {
        description: 'Verifique sua caixa de entrada e spam. O link é válido por 1 hora.'
      });
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar email de reset:', error);
      
      let errorMessage = 'Não foi possível enviar o email de recuperação.';
      
      if (error?.message?.includes('rate_limit')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      } else if (error?.message?.includes('not found')) {
        errorMessage = 'Email não encontrado no sistema.';
      } else {
        errorMessage = `${error?.message || 'Verifique se o email está correto.'}\n\nSe o problema persistir, entre em contato com o administrador para verificar a configuração de email no Supabase (Authentication → Email Templates → SMTP Settings).`;
      }
      
      toast.error('Erro ao enviar email', {
        description: errorMessage
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(`Erro ao alterar senha: ${error?.message || 'Tente novamente.'}`);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendResetEmail,
    resetPassword,
    loading
  };
};