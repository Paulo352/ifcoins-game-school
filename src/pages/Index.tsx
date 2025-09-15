import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';
import LoginPage from '@/pages/LoginPage';
import { MaintenanceScreen } from '@/components/maintenance/MaintenanceScreen';
import { UserSettings } from '@/components/settings/UserSettings';
import { Analytics } from '@/components/analytics/Analytics';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { TeacherGiveCoins } from '@/components/sections/TeacherGiveCoins';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AdminGiveCoins } from '@/components/sections/AdminGiveCoins';
import { NewCardShop } from '@/components/cards/NewCardShop';
import { NewManageCards } from '@/components/cards/NewManageCards';
import { Rankings } from '@/components/sections/Rankings';
import { Events } from '@/components/sections/Events';
import { ManageStudents } from '@/components/sections/ManageStudents';
import { NewCollection } from '@/components/cards/NewCollection';
import { Settings } from '@/components/sections/Settings';
import { Polls } from '@/components/sections/Polls';
import { AITutor } from '@/components/sections/AITutor';
import { useLocation } from 'react-router-dom';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { status: maintenanceStatus } = useMaintenanceMode();
  const [activeSection, setActiveSection] = useState('dashboard');
  const location = useLocation();

  // Verificar se é página de reset de senha
  const isResetPasswordPage = location.pathname === '/reset-password' || 
    (location.hash && location.hash.includes('type=recovery'));

  console.log('Index - User:', user?.email, 'Profile:', profile?.role, 'Loading:', loading);

  if (loading || maintenanceStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
        showBackToLogin={true}
      />
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Wait for profile to load before rendering content
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        if (profile.role === 'student') return <StudentDashboard onSectionChange={setActiveSection} />;
        if (profile.role === 'teacher') return <TeacherDashboard />;
        if (profile.role === 'admin') return <AdminDashboard />;
        break;
      case 'shop':
        return <NewCardShop />;
      case 'collection':
        return <NewCollection />;
      case 'give-coins':
        if (profile.role === 'teacher') return <TeacherGiveCoins />;
        if (profile.role === 'admin') return <AdminGiveCoins />;
        break;
      case 'rankings':
        return <Rankings />;
      case 'events':
        return <Events />;
      case 'manage-students':
        return <ManageStudents />;
      case 'manage-cards':
        return <NewManageCards />;
      case 'settings':
        if (profile.role === 'admin') return <Settings />;
        return <UserSettings />;
      case 'admin-settings':
        return <Settings />;
      case 'analytics':
        return <Analytics />;
      case 'polls':
        return <Polls />;
      case 'ai-tutor':
        return <AITutor />;
      default:
        if (profile.role === 'student') return <StudentDashboard onSectionChange={setActiveSection} />;
        if (profile.role === 'teacher') return <TeacherDashboard />;
        if (profile.role === 'admin') return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <Header 
          onSectionChange={setActiveSection} 
          currentSection={activeSection}
          activeSection={activeSection}
        />
        <main className="flex-1 p-4 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col">
          <Header 
            onSectionChange={setActiveSection} 
            currentSection={activeSection}
            activeSection={activeSection}
          />
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;