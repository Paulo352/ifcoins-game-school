import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStartQuizAttempt, useActiveQuizzes, useUserAttempts } from '@/hooks/quizzes/useQuizSystem';
import { supabase } from '@/integrations/supabase/client';
import { QuizSystemList } from './QuizSystemList';
import { QuizSystemAttempt } from './QuizSystemAttempt';
import { QuizHistory } from './QuizHistory';
import { QuizBadges } from './QuizBadges';
import { QuizRanking } from './QuizRanking';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type View = 'list' | 'attempt' | 'history' | 'badges' | 'ranking';

export function QuizSystemMain() {
  const { profile, user, loading: authLoading } = useAuth();
  const { data: quizzes } = useActiveQuizzes();
  const { data: userAttempts } = useUserAttempts(profile?.id || null);
  const startQuizMutation = useStartQuizAttempt();
  
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('list');
  const [practiceMode, setPracticeMode] = useState(false);

  console.log('🎯 QuizSystemMain - Estado:', {
    profile: !!profile,
    user: !!user,
    authLoading,
    selectedQuizId,
    currentAttemptId,
    currentView,
    startQuizPending: startQuizMutation.isPending
  });

  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Você precisa estar logado para acessar os quizzes.</p>
      </div>
    );
  }

  const selectedQuiz = quizzes?.find(q => q.id === selectedQuizId);

  const handleStartQuiz = async (quizId: string, isPracticeMode = false) => {
    console.log('🎯 Iniciando quiz:', quizId, 'Modo prática:', isPracticeMode);
    
    setPracticeMode(isPracticeMode);
    
    // Se for modo prática, permitir sempre
    if (!isPracticeMode) {
      // Verificar se o estudante já completou este quiz
      const completedAttempt = userAttempts?.find(
        (attempt: any) => attempt.quiz_id === quizId && attempt.is_completed && !attempt.practice_mode
      );
      
      if (completedAttempt) {
        toast.error('Você já completou este quiz! Use o Modo Prática para revisar.');
        return;
      }
    }
    
    try {
      // Usar a nova função RPC se disponível
      const { data, error } = await supabase.rpc('start_quiz_attempt', {
        p_quiz_id: quizId,
        p_user_id: profile!.id,
        p_practice_mode: isPracticeMode
      });

      if (error) throw error;
      
      const result = data as { success: boolean; attempt_id: string; practice_mode: boolean };
      
      setSelectedQuizId(quizId);
      setCurrentAttemptId(result.attempt_id);
      setCurrentView('attempt');
      console.log('✅ Quiz iniciado com sucesso:', result.attempt_id);
    } catch (error) {
      console.error('❌ Erro ao iniciar quiz:', error);
      toast.error('Erro ao iniciar quiz');
    }
  };

  const handleCompleteQuiz = () => {
    console.log('🎯 Quiz completado');
    setSelectedQuizId(null);
    setCurrentAttemptId(null);
  };

  const handleBackToList = () => {
    console.log('🎯 Voltando à lista de quizzes');
    setSelectedQuizId(null);
    setCurrentAttemptId(null);
    setCurrentView('list');
    setPracticeMode(false);
  };

  // Renderizar views alternativas
  if (currentView === 'history') {
    return <QuizHistory onBack={() => setCurrentView('list')} />;
  }

  if (currentView === 'badges') {
    return <QuizBadges onBack={() => setCurrentView('list')} />;
  }

  if (currentView === 'ranking') {
    return <QuizRanking onBack={() => setCurrentView('list')} />;
  }

  // Se um quiz foi selecionado e temos o ID da tentativa, mostrar o quiz
  if (selectedQuiz && currentAttemptId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBackToList}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Quizzes
        </Button>
        
        <QuizSystemAttempt
          quiz={selectedQuiz}
          attemptId={currentAttemptId}
          userId={profile.id}
          onComplete={handleCompleteQuiz}
          onBack={handleBackToList}
          practiceMode={practiceMode}
        />
      </div>
    );
  }

  // Caso contrário, mostrar a lista de quizzes
  return <QuizSystemList onStartQuiz={handleStartQuiz} onViewChange={setCurrentView} />;
}