
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';
import { AdminStats } from '@/components/admin/AdminStats';
import { GiveCoinsForm } from '@/components/admin/GiveCoinsForm';
import { RecentRewards } from '@/components/admin/RecentRewards';

export function AdminGiveCoins() {
  const { profile } = useAuth();

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: profile?.role === 'admin',
  });

  const { data: recentRewards } = useQuery({
    queryKey: ['recent-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_logs')
        .select(`
          *,
          student:profiles!reward_logs_student_id_fkey(name),
          teacher:profiles!reward_logs_teacher_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem dar moedas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dar Moedas IFCoins
        </h1>
        <p className="text-gray-600 mt-1">
          Recompense usuários com moedas IFCoins
        </p>
      </div>

      <AdminStats users={users} recentRewards={recentRewards} />
      
      <GiveCoinsForm 
        users={users} 
        onSuccess={refetchUsers}
      />
      
      <RecentRewards recentRewards={recentRewards} />
    </div>
  );
}
