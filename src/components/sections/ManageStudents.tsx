import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';
import { UserStats } from '@/components/manage/UserStats';
import { TeacherGiveCoinsSection } from '@/components/manage/TeacherGiveCoinsSection';
import { UsersTable } from '@/components/manage/UsersTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserManagement } from '@/components/manage/AdminUserManagement';
import { IntrusoManagement } from '@/components/manage/IntrusoManagement';
import { AlertTriangle } from 'lucide-react';

export function ManageStudents() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('students');

  const { data: users, refetch } = useQuery({
    queryKey: ['manage-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!profile && (profile.role === 'admin' || profile.role === 'teacher'),
  });

  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores e professores podem gerenciar usuários.</p>
      </div>
    );
  }

  const studentUsers = users?.filter(user => user.role === 'student') || [];
  const teacherUsers = users?.filter(user => user.role === 'teacher') || [];
  const adminUsers = users?.filter(user => user.role === 'admin') || [];
  const intrusoUsers = users?.filter(user => user.role === 'intruso') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="text-gray-600 mt-1">
          Visualize e gerencie usuários do sistema por categoria
        </p>
      </div>

      <UserStats users={users} />

      {profile.role === 'teacher' && (
        <TeacherGiveCoinsSection 
          users={users}
          teacherId={profile.id}
          onSuccess={refetch}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${profile.role === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="students">
            Alunos ({studentUsers.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Professores ({teacherUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admins ({adminUsers.length})
          </TabsTrigger>
          {profile.role === 'admin' && (
            <TabsTrigger value="intrusos" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Intrusos ({intrusoUsers.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Estudantes ({studentUsers.length})</h3>
            <UsersTable users={studentUsers} onRefresh={refetch} />
            
            {profile.role === 'admin' && (
              <AdminUserManagement 
                users={studentUsers}
                adminId={profile.id}
                onSuccess={refetch}
                userType="student"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Professores ({teacherUsers.length})</h3>
            <UsersTable users={teacherUsers} onRefresh={refetch} />
            
            {profile.role === 'admin' && (
              <AdminUserManagement 
                users={teacherUsers}
                adminId={profile.id}
                onSuccess={refetch}
                userType="teacher"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Administradores ({adminUsers.length})</h3>
            <UsersTable users={adminUsers} onRefresh={refetch} />
            
            {profile.role === 'admin' && (
              <AdminUserManagement 
                users={adminUsers}
                adminId={profile.id}
                onSuccess={refetch}
                userType="admin"
              />
            )}
          </div>
        </TabsContent>

        {profile.role === 'admin' && (
          <TabsContent value="intrusos" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Intrusos ({intrusoUsers.length})
              </h3>
              <IntrusoManagement 
                users={intrusoUsers}
                onSuccess={refetch}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}