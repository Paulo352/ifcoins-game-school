import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DAILY_LIMIT = 500;

export function useTeacherDailyLimit() {
  const { profile } = useAuth();
  
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
      
      return data?.reduce((total, log) => total + log.coins, 0) || 0;
    },
    enabled: !!profile?.id && profile.role === 'teacher',
  });

  const remainingCoins = Math.max(0, DAILY_LIMIT - dailyCoins);
  const canGiveSpecialCoins = remainingCoins > 0;
  const limitReached = dailyCoins >= DAILY_LIMIT;

  return {
    dailyCoins,
    remainingCoins,
    canGiveSpecialCoins,
    limitReached,
    dailyLimit: DAILY_LIMIT,
    refetch
  };
}