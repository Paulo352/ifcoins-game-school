import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeacherStats } from '@/components/teacher/TeacherStats';
import { TeacherGiveCoinsForm } from '@/components/teacher/TeacherGiveCoinsForm';
import { TeacherRecentRewards } from '@/components/teacher/TeacherRecentRewards';
import { TeacherClassDashboard } from '@/components/teacher/TeacherClassDashboard';
import { ClassCommunication } from '@/components/admin/ClassCommunication';
import { ClassInviteManagement } from '@/components/admin/ClassInviteManagement';
import { CSVImport } from '@/components/admin/CSVImport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TeacherDashboard() {
  const { profile } = useAuth();

  const { data: students } = useQuery({
    queryKey: ['students-for-teacher'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: todayRewards } = useQuery({
    queryKey: ['today-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('reward_logs')
        .select('*')
        .eq('teacher_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: recentRewards } = useQuery({
    queryKey: ['teacher-recent-rewards', profile?.id],
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
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  if (!profile || profile.role !== 'teacher') return null;

  const todayCoinsGiven = todayRewards?.reduce((acc, reward) => acc + reward.coins, 0) || 0;
  const todayStudentsRewarded = new Set(todayRewards?.map(r => r.student_id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Painel do Professor
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {profile.name}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="management">Gestão</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TeacherStats
            todayCoinsGiven={todayCoinsGiven}
            todayStudentsRewarded={todayStudentsRewarded}
            totalStudents={students?.length || 0}
            totalRewards={recentRewards?.length || 0}
          />

          <TeacherGiveCoinsForm 
            students={students}
            teacherId={profile.id}
            onSuccess={() => {}}
          />

          <TeacherRecentRewards recentRewards={recentRewards} />
        </TabsContent>

        <TabsContent value="dashboard">
          <TeacherClassDashboard />
        </TabsContent>

        <TabsContent value="communication">
          <ClassCommunication />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ClassInviteManagement />
            <CSVImport />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
