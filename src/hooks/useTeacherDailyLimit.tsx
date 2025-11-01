import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminConfig } from './useAdminConfig';

export function useTeacherDailyLimit() {
  const { profile } = useAuth();
  const { getConfig, config } = useAdminConfig();
  const queryClient = useQueryClient();
  
  // Buscar o limite configurado pelo admin (padrão: 500) - 100% reativo ao config
  const dailyLimit = React.useMemo(() => {
    const configValue = getConfig('teacher_daily_limit', '500');
    const limit = parseInt(configValue) || 500;
    console.log('✅ Daily limit atualizado para:', limit, 'do config:', configValue);
    return limit;
  }, [config, getConfig]);

  // Força invalidação quando o limite mudar
  useEffect(() => {
    console.log('🔄 Limite mudou, invalidando queries...');
    queryClient.invalidateQueries({ queryKey: ['teacher-daily-coins'] });
  }, [dailyLimit, queryClient]);
  
  // Query das moedas já distribuídas hoje
  const { data: dailyCoins = 0, refetch } = useQuery({
    queryKey: ['teacher-daily-coins', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('reward_logs')
        .select('coins')
        .eq('teacher_id', profile.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());
      
      if (error) throw error;
      
      const total = data?.reduce((total, log) => total + log.coins, 0) || 0;
      console.log('💰 Moedas distribuídas hoje:', total);
      return total;
    },
    enabled: !!profile?.id && profile.role === 'teacher',
    refetchInterval: 30000, // Revalidar a cada 30s para garantir sincronia
  });

  const remainingCoins = Math.max(0, dailyLimit - dailyCoins);
  const canGiveSpecialCoins = remainingCoins > 0;
  const limitReached = dailyCoins >= dailyLimit;
  const percentageUsed = dailyLimit > 0 ? Math.round((dailyCoins / dailyLimit) * 100) : 0;

  console.log('📊 Status do limite diário:', {
    dailyCoins,
    dailyLimit,
    remainingCoins,
    percentageUsed,
    limitReached
  });

  return {
    dailyCoins,
    remainingCoins,
    canGiveSpecialCoins,
    limitReached,
    dailyLimit,
    percentageUsed,
    refetch
  };
}