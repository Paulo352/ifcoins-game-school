
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { AuthPage } from '@/components/auth/AuthPage';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';
import { MaintenanceScreen } from '@/components/maintenance/MaintenanceScreen';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { useLocation } from 'react-router-dom';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { status: maintenanceStatus } = useMaintenanceMode();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get('section') || 'dashboard';

  // Verificar se é página de reset de senha
  const isResetPasswordPage = location.pathname === '/reset-password' || 
    (location.hash && location.hash.includes('type=recovery'));

  console.log('Index - User:', user?.email, 'Profile:', profile?.role, 'Loading:', loading);

  if (loading || maintenanceStatus.loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Página de reset de senha tem prioridade
  if (isResetPasswordPage) {
    return <ResetPasswordPage />;
  }

  // Verificar modo manutenção (exceto para admins)
  if (maintenanceStatus.enabled && profile?.role !== 'admin') {
    return (
      <MaintenanceScreen 
        message={maintenanceStatus.message}
        scheduledAt={maintenanceStatus.scheduled_at}
        showEmailNotice={true}
      />
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (section) {
      case 'dashboard':
        if (profile.role === 'student') return <StudentDashboard onSectionChange={() => {}} />;
        if (profile.role === 'teacher') return <TeacherDashboard />;
        if (profile.role === 'admin') return <AdminDashboard onSectionChange={() => {}} />;
        break;
      case 'shop':
        return <div>Shop (em construção)</div>;
      case 'collection':
        return <div>Collection (em construção)</div>;
      case 'give-coins':
        return <div>Give Coins (em construção)</div>;
      case 'rankings':
        return <div>Rankings (em construção)</div>;
      case 'events':
        return <div>Events (em construção)</div>;
      case 'manage-students':
        return <div>Manage Students (em construção)</div>;
      case 'manage-cards':
        return <div>Manage Cards (em construção)</div>;
      case 'settings':
        return <div>Settings (em construção)</div>;
      case 'admin-settings':
        return <div>Admin Settings (em construção)</div>;
      case 'analytics':
        return <div>Analytics (em construção)</div>;
      case 'polls':
        return <div>Polls (em construção)</div>;
      default:
        if (profile.role === 'student') return <StudentDashboard onSectionChange={() => {}} />;
        if (profile.role === 'teacher') return <TeacherDashboard />;
        if (profile.role === 'admin') return <AdminDashboard onSectionChange={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <div className="flex-1 flex flex-col bg-background">
        <main className="flex-1 p-6 bg-background">
          {profile.role === 'student' && <StudentDashboard onSectionChange={() => {}} />}
          {profile.role === 'teacher' && <TeacherDashboard />}
          {profile.role === 'admin' && <AdminDashboard onSectionChange={() => {}} />}
        </main>
      </div>
    </div>
  );
};

export default Index;
