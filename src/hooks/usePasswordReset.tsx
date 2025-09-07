import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);

  const sendResetEmail = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar email de reset:', error);
      toast.error(`Erro ao enviar email de recuperação: ${error?.message || 'Verifique se o email está correto e as configurações de email do projeto.'}`);
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