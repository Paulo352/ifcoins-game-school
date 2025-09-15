import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuizList } from '../quizzes/QuizList';
import { QuizAttempt } from '../quizzes/QuizAttempt';
import { useActiveQuizzes } from '@/hooks/quizzes/useQuizzes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function Quizzes() {
  const { profile } = useAuth();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const { data: quizzes } = useActiveQuizzes();

  const selectedQuiz = quizzes?.find(q => q.id === selectedQuizId);

  const handleStartQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
  };

  const handleCompleteQuiz = () => {
    setSelectedQuizId(null);
  };

  const handleBackToList = () => {
    setSelectedQuizId(null);
  };

  if (selectedQuiz && profile) {
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