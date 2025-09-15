
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStats } from '../admin/AdminStats';
import { ManageStudents } from '../sections/ManageStudents';
import { AdminGiveCoins } from '../sections/AdminGiveCoins';
import { Settings } from '../sections/Settings';
import { NewManageCards } from '../cards/NewManageCards';
import { ManagePacks } from '../packs/ManagePacks';
import { ManageQuizzes } from '../quizzes/ManageQuizzes';
import { Events } from '../sections/Events';
import { Polls } from '../sections/Polls';
import { AITutor } from '../sections/AITutor';
import { 
  Users, 
  CreditCard, 
  Coins, 
  BarChart3, 
  Calendar, 
  Vote, 
  Bot, 
  Settings as SettingsIcon,
  Package,
  HelpCircle
} from 'lucide-react';

interface AdminDashboardProps {
  // No props needed since we'll manage state internally
}

export function AdminDashboard({}: AdminDashboardProps) {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('stats');

  const sections = [
    { id: 'stats', name: 'Estatísticas', icon: BarChart3 },
    { id: 'students', name: 'Gerenciar Estudantes', icon: Users },
    { id: 'coins', name: 'Dar Moedas', icon: Coins },
    { id: 'cards', name: 'Gerenciar Cartas', icon: CreditCard },
    { id: 'packs', name: 'Gerenciar Pacotes', icon: Package },
    { id: 'quizzes', name: 'Gerenciar Quizzes', icon: HelpCircle },
    { id: 'events', name: 'Eventos', icon: Calendar },
    { id: 'polls', name: 'Votações', icon: Vote },
    { id: 'ai-tutor', name: 'IA Tutor', icon: Bot },
    { id: 'settings', name: 'Configurações', icon: SettingsIcon },
  ];

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="flex h-full">
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Painel Admin</h2>
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {section.name}
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 p-6">
        {activeSection === 'stats' && <AdminStats users={[]} recentRewards={[]} />}
        {activeSection === 'students' && <ManageStudents />}
        {activeSection === 'coins' && <AdminGiveCoins />}
        {activeSection === 'cards' && <NewManageCards />}
        {activeSection === 'packs' && <ManagePacks />}
        {activeSection === 'quizzes' && <ManageQuizzes />}
        {activeSection === 'events' && <Events />}
        {activeSection === 'polls' && <Polls />}
        {activeSection === 'ai-tutor' && <AITutor />}
        {activeSection === 'settings' && <Settings />}
      </div>
    </div>
  );
}
