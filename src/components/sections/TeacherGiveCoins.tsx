import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';
import { TeacherGiveCoinsForm } from '@/components/teacher/TeacherGiveCoinsForm';
import { TeacherDailyLimitDisplay } from '@/components/teacher/TeacherDailyLimitDisplay';

export function TeacherGiveCoins() {
  const { profile } = useAuth();

  const { data: students, refetch: refetchStudents } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('name');
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: recentRewards, refetch: refetchRecentRewards } = useQuery({
    queryKey: ['teacher-recent-special-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('reward_logs')
        .select(`
          *,
          student:profiles!reward_logs_student_id_fkey(name)
        `)
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  if (!profile || profile.role !== 'teacher') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas professores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <TeacherDailyLimitDisplay />

        <TeacherGiveCoinsForm 
          students={students}
          teacherId={profile.id}
          onSuccess={() => {
            refetchStudents();
            refetchRecentRewards();
          }}
        />

        {/* Recent Rewards */}
        {recentRewards && recentRewards.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Últimas Recompensas Especiais</h3>
            <div className="space-y-2">
              {recentRewards.map((reward: any) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{reward.student?.name}</p>
                    <p className="text-sm text-muted-foreground">{reward.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reward.created_at).toLocaleDateString('pt-BR')} às {new Date(reward.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="font-bold text-lg">{reward.coins}</span>
                    <span className="text-yellow-500">🪙</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
