import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Gift, Trophy, FileText, Package, Calendar, Vote, MessageSquare, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import { ManageStudents } from '@/components/sections/ManageStudents';
import { AdminGiveCoins } from '@/components/sections/AdminGiveCoins';
import { Trades } from '@/components/sections/Trades';
import { Rankings } from '@/components/sections/Rankings';
import { NewManageCards } from '@/components/cards/NewManageCards';
import { ManagePacks } from '@/components/packs/ManagePacks';
import { Events } from '@/components/sections/Events';
import { Polls } from '@/components/sections/Polls';
import { Quizzes } from '@/components/sections/Quizzes';
import { Settings } from '@/components/sections/Settings';
import { AITutor } from '@/components/sections/AITutor';
import { QuizReports } from '@/components/quizzes/QuizReports';

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<'manage' | 'give-coins' | 'trades' | 'rankings' | 'cards' | 'packs' | 'events' | 'polls' | 'quizzes' | 'quiz-reports' | 'ai-tutor' | 'settings'>('manage');

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 space-y-2">
        <h2 className="text-lg font-semibold px-4 py-2">Menu Admin</h2>
        <nav className="space-y-1">
          <Button
            variant={activeSection === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveSection('manage')}
            className="w-full justify-start"
          >
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Usuários
          </Button>
          <Button
            variant={activeSection === 'give-coins' ? 'default' : 'outline'}
            onClick={() => setActiveSection('give-coins')}
            className="w-full justify-start"
          >
            <Gift className="mr-2 h-4 w-4" />
            Dar Moedas
          </Button>
          <Button
            variant={activeSection === 'trades' ? 'default' : 'outline'}
            onClick={() => setActiveSection('trades')}
            className="w-full justify-start"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Trocas
          </Button>
          <Button
            variant={activeSection === 'rankings' ? 'default' : 'outline'}
            onClick={() => setActiveSection('rankings')}
            className="w-full justify-start"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Rankings
          </Button>
          <Button
            variant={activeSection === 'cards' ? 'default' : 'outline'}
            onClick={() => setActiveSection('cards')}
            className="w-full justify-start"
          >
            <FileText className="mr-2 h-4 w-4" />
            Cartas
          </Button>
          <Button
            variant={activeSection === 'packs' ? 'default' : 'outline'}
            onClick={() => setActiveSection('packs')}
            className="w-full justify-start"
          >
            <Package className="mr-2 h-4 w-4" />
            Pacotes
          </Button>
          <Button
            variant={activeSection === 'events' ? 'default' : 'outline'}
            onClick={() => setActiveSection('events')}
            className="w-full justify-start"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Eventos
          </Button>
          <Button
            variant={activeSection === 'polls' ? 'default' : 'outline'}
            onClick={() => setActiveSection('polls')}
            className="w-full justify-start"
          >
            <Vote className="mr-2 h-4 w-4" />
            Votações
          </Button>
          <Button
            variant={activeSection === 'quizzes' ? 'default' : 'outline'}
            onClick={() => setActiveSection('quizzes')}
            className="w-full justify-start"
          >
            <FileText className="mr-2 h-4 w-4" />
            Quizzes
          </Button>
          <Button
            variant={activeSection === 'quiz-reports' ? 'default' : 'outline'}
            onClick={() => setActiveSection('quiz-reports')}
            className="w-full justify-start"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios de Quiz
          </Button>
          <Button
            variant={activeSection === 'ai-tutor' ? 'default' : 'outline'}
            onClick={() => setActiveSection('ai-tutor')}
            className="w-full justify-start"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            AI Tutor
          </Button>
          <Button
            variant={activeSection === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveSection('settings')}
            className="w-full justify-start"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </nav>
      </aside>

      <main className="flex-1">
        {activeSection === 'manage' && <ManageStudents />}
        {activeSection === 'give-coins' && <AdminGiveCoins />}
        {activeSection === 'trades' && <Trades />}
        {activeSection === 'rankings' && <Rankings />}
        {activeSection === 'cards' && <NewManageCards />}
        {activeSection === 'packs' && <ManagePacks />}
        {activeSection === 'events' && <Events />}
        {activeSection === 'polls' && <Polls />}
        {activeSection === 'quizzes' && <Quizzes />}
        {activeSection === 'quiz-reports' && <QuizReports onBack={() => setActiveSection('quizzes')} />}
        {activeSection === 'ai-tutor' && <AITutor />}
        {activeSection === 'settings' && <Settings />}
      </main>
    </div>
  );
}
