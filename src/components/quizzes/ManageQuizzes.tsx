import React, { useState } from 'react';
import { useQuizzes, useDeleteQuiz, useUpdateQuizStatus } from '@/hooks/quizzes/useQuizSystem';
import { QuizForm } from './QuizForm';
import { QuizCard } from './QuizCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { HelpCircle, Plus } from 'lucide-react';

export function ManageQuizzes() {
  const [showForm, setShowForm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  
  const { data: quizzes, isLoading } = useAllQuizzes();
  const deleteQuiz = useDeleteQuiz();
  const updateQuizStatus = useUpdateQuizStatus();

  const handleToggleStatus = (quizId: string, isActive: boolean) => {
    updateQuizStatus.mutate({ quizId, isActive });
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizToDelete(quizId);
  };

  const confirmDelete = () => {
    if (quizToDelete) {
      deleteQuiz.mutate(quizToDelete);
      setQuizToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Quizzes</h2>
          <p className="text-muted-foreground">
            Crie e gerencie quizzes para seus alunos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Ocultar Formulário' : 'Novo Quiz'}
        </Button>
      </div>

      {showForm && (
        <QuizForm onSuccess={() => setShowForm(false)} />
      )}

      {!quizzes || quizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum quiz criado</h3>
            <p className="text-muted-foreground">
              Crie seu primeiro quiz para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              showManagement
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteQuiz}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!quizToDelete} onOpenChange={() => setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.
              Todas as tentativas e respostas relacionadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}