
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Coins, Award } from 'lucide-react';
import { Profile } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AdminStatsProps {
  users: Profile[] | undefined;
  recentRewards: any[] | undefined;
}

export function AdminStats({ users, recentRewards }: AdminStatsProps) {
  const totalCoinsDistributed = recentRewards?.reduce((acc, reward) => acc + reward.coins, 0) || 0;
  const queryClient = useQueryClient();

  // Escutar mudanças em tempo real para atualizar estatísticas do admin
  useEffect(() => {
    const channel = supabase
      .channel('admin-stats-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('🔄 Novo usuário criado:', payload);
          // Atualizar lista de usuários
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_logs',
        },
        (payload) => {
          console.log('🔄 Nova recompensa no sistema:', payload);
          // Atualizar recompensas recentes
          queryClient.invalidateQueries({ queryKey: ['recent-rewards'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Total de Usuários</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">{users?.length || 0}</p>
          <p className="text-sm text-gray-600">Cadastrados no sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">Moedas Distribuídas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-600">{totalCoinsDistributed}</p>
          <p className="text-sm text-gray-600">Últimas 10 recompensas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Recompensas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{recentRewards?.length || 0}</p>
          <p className="text-sm text-gray-600">Registros recentes</p>
        </CardContent>
      </Card>
    </div>
  );
}
