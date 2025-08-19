
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AdminGiveCoins } from '@/components/sections/AdminGiveCoins';
import { CardShop } from '@/components/cards/CardShop';
import { Collection } from '@/components/cards/Collection';
import { Rankings } from '@/components/sections/Rankings';
import { Events } from '@/components/sections/Events';
import { ManageStudents } from '@/components/sections/ManageStudents';
import { ManageCards } from '@/components/cards/ManageCards';
import { Settings } from '@/components/sections/Settings';
import { Trades } from '@/components/sections/Trades';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { profile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <AuthPage />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        if (profile.role === 'student') return <StudentDashboard onSectionChange={setActiveSection} />;
        if (profile.role === 'teacher') return <TeacherDashboard />;
        if (profile.role === 'admin') return <AdminDashboard onSectionChange={setActiveSection} />;
        break;
      case 'shop':
        return <CardShop />;
      case 'collection':
        return <Collection />;
      case 'give-coins':
        if (profile.role === 'teacher') return <TeacherDashboard />;
        if (profile.role === 'admin') return <AdminGiveCoins />;
        break;
      case 'rankings':
        return <Rankings />;
      case 'events':
        return <Events />;
      case 'manage-students':
        return <ManageStudents />;
      case 'manage-cards':
        return <ManageCards />;
      case 'settings':
        return <Settings />;
      case 'trades':
        return <Trades />;
      default:
        return <StudentDashboard onSectionChange={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
