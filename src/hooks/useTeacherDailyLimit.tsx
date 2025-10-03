import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminConfig } from './useAdminConfig';

export function useTeacherDailyLimit() {
  const { profile } = useAuth();
  const { getConfig, config } = useAdminConfig();
  
  // Buscar o limite configurado pelo admin (padrão: 500) - reativo ao config
  // Usa useMemo para recalcular quando config mudar
  const dailyLimit = React.useMemo(() => {
    const limit = parseInt(getConfig('teacher_daily_limit', '500'));
    console.log('Daily limit atualizado:', limit);
    return limit;
  }, [config.teacher_daily_limit, getConfig]);
  
  // Incluir dailyLimit no queryKey para forçar refetch quando mudar
  const { data: dailyCoins = 0, refetch } = useQuery({
    queryKey: ['teacher-daily-coins', profile?.id, dailyLimit],
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
      
      return data?.reduce((total, log) => total + log.coins, 0) || 0;
    },
    enabled: !!profile?.id && profile.role === 'teacher',
  });

  const remainingCoins = Math.max(0, dailyLimit - dailyCoins);
  const canGiveSpecialCoins = remainingCoins > 0;
  const limitReached = dailyCoins >= dailyLimit;

  return {
    dailyCoins,
    remainingCoins,
    canGiveSpecialCoins,
    limitReached,
    dailyLimit,
    refetch
  };
}