
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useActiveEvent } from '@/hooks/useActiveEvent';

export function useUpdateCoins() {
  const [loading, setLoading] = useState(false);
  const { calculateBonusCoins, activeEvent } = useActiveEvent();

  const updateUserCoins = async (userId: string, amount: number) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_user_coins', {
        user_id: userId,
        amount: amount
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar moedas:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const giveCoins = async (
    userId: string, 
    amount: number, 
    reason: string, 
    teacherId: string,
    userName: string
  ) => {
    // Apply event bonus multiplier
    const finalAmount = calculateBonusCoins(amount);
    const success = await updateUserCoins(userId, finalAmount);
    
    if (success) {
      try {
        // Registrar log da recompensa
        const { error: logError } = await supabase
          .from('reward_logs')
          .insert({
            teacher_id: teacherId,
            student_id: userId,
            coins: finalAmount,
            reason: activeEvent ? `${reason} (Evento: ${activeEvent.name} - ${activeEvent.bonus_multiplier}x)` : reason
          });

        if (logError) throw logError;

        toast({
          title: "Moedas entregues!",
          description: activeEvent 
            ? `${finalAmount} IFCoins foram dados para ${userName} (${amount} x ${activeEvent.bonus_multiplier} - ${activeEvent.name})`
            : `${finalAmount} IFCoins foram dados para ${userName}`,
        });
        
        return true;
      } catch (error) {
        console.error('Erro ao registrar log:', error);
        toast({
          title: "Erro",
          description: "Moedas foram dadas mas não foi possível registrar o log",
          variant: "destructive"
        });
        return true; // Moedas foram dadas mesmo com erro no log
      }
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível dar as moedas",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    giveCoins,
    updateUserCoins,
    loading,
    activeEvent,
    calculateBonusCoins
  };
}
