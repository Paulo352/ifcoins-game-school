import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Gift, Trophy, FileText, BarChart3 } from 'lucide-react';
import { ManageStudents } from '@/components/sections/ManageStudents';
import { TeacherGiveCoins } from '@/components/sections/TeacherGiveCoins';
import { Rankings } from '@/components/sections/Rankings';
import { Quizzes } from '@/components/sections/Quizzes';
import { QuizReports } from '@/components/quizzes/QuizReports';

export function TeacherDashboard() {
  const [activeSection, setActiveSection] = useState<'manage' | 'give-coins' | 'rankings' | 'quizzes' | 'quiz-reports'>('manage');

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 space-y-2">
        <h2 className="text-lg font-semibold px-4 py-2">Menu Professor</h2>
        <nav className="space-y-1">
          <Button
            variant={activeSection === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveSection('manage')}
            className="w-full justify-start"
          >
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Estudantes
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
            variant={activeSection === 'rankings' ? 'default' : 'outline'}
            onClick={() => setActiveSection('rankings')}
            className="w-full justify-start"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Rankings
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
        </nav>
      </aside>

      <main className="flex-1">
        {activeSection === 'manage' && <ManageStudents />}
        {activeSection === 'give-coins' && <TeacherGiveCoins />}
        {activeSection === 'rankings' && <Rankings />}
        {activeSection === 'quizzes' && <Quizzes />}
        {activeSection === 'quiz-reports' && <QuizReports onBack={() => setActiveSection('quizzes')} />}
      </main>
    </div>
  );
}
