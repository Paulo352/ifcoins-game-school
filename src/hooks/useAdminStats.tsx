import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStatsData {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCards: number;
  totalCoinsInCirculation: number;
  totalTrades: number;
  totalEvents: number;
  recentActivity: Array<{
    action: string;
    user: string;
    time: string;
  }>;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStatsData>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCards: 0,
    totalCoinsInCirculation: 0,
    totalTrades: 0,
    totalEvents: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas de usuários
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, coins');

      const totalUsers = profiles?.length || 0;
      const totalStudents = profiles?.filter(p => p.role === 'student').length || 0;
      const totalTeachers = profiles?.filter(p => p.role === 'teacher').length || 0;
      const totalCoinsInCirculation = profiles?.reduce((sum, p) => sum + (p.coins || 0), 0) || 0;

      // Buscar cartas
      const { data: cards } = await supabase
        .from('cards')
        .select('id');

      // Buscar trocas
      const { data: trades } = await supabase
        .from('trades')
        .select('id');

      // Buscar eventos
      const { data: events } = await supabase
        .from('events')
        .select('id');

      // Buscar atividade recente dos logs de recompensa
      const { data: recentRewards } = await supabase
        .from('reward_logs')
        .select(`
          coins,
          reason,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentActivity = recentRewards?.map(reward => ({
        action: `${reward.coins} moedas distribuídas - ${reward.reason}`,
        user: 'Sistema',
        time: formatTimeAgo(new Date(reward.created_at))
      })) || [];

      setStats({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalCards: cards?.length || 0,
        totalCoinsInCirculation,
        totalTrades: trades?.length || 0,
        totalEvents: events?.length || 0,
        recentActivity
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refreshStats: fetchStats
  };
};