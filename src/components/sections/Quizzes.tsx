import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuizList } from '../quizzes/QuizList';
import { QuizAttempt } from '../quizzes/QuizAttempt';
import { useActiveQuizzes } from '@/hooks/quizzes/useQuizzes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function Quizzes() {
  const { profile, user, loading: authLoading } = useAuth();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const { data: quizzes } = useActiveQuizzes();

  console.log('Quizzes - Profile:', profile, 'User:', user, 'AuthLoading:', authLoading);

  const selectedQuiz = quizzes?.find(q => q.id === selectedQuizId);

  const handleStartQuiz = (quizId: string) => {
    console.log('Starting quiz:', quizId, 'Profile ID:', profile?.id);
    setSelectedQuizId(quizId);
  };

  const handleCompleteQuiz = () => {
    setSelectedQuizId(null);
  };

  const handleBackToList = () => {
    setSelectedQuizId(null);
  };

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

  if (selectedQuiz && selectedQuizId) {
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
        
        <QuizAttempt
          quiz={selectedQuiz}
          userId={profile.id}
          onComplete={handleCompleteQuiz}
        />
      </div>
    );
  }

  return <QuizList onStartQuiz={handleStartQuiz} />;
}