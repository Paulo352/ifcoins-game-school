import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuizList } from './QuizList';
import { ManageQuizzes } from './ManageQuizzes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Settings } from 'lucide-react';

export function QuizzesDashboard() {
  const { profile } = useAuth();
  const isAdminOrTeacher = profile?.role === 'admin' || profile?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Quizzes</h1>
        <p className="text-muted-foreground">
          {isAdminOrTeacher ? 
            'Crie e gerencie quizzes para os alunos ganharem moedas' : 
            'Responda quizzes e ganhe moedas! Você precisa de pelo menos 70% de acertos.'
          }
        </p>
      </div>

      {isAdminOrTeacher ? (
        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Gerenciar Quizzes
            </TabsTrigger>
            <TabsTrigger value="student-view" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Visualização do Aluno
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage">
            <ManageQuizzes />
          </TabsContent>

          <TabsContent value="student-view">
            <QuizList onStartQuiz={() => {}} />
          </TabsContent>
        </Tabs>
      ) : (
        <QuizList onStartQuiz={() => {}} />
      )}
    </div>
  );
}