import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { QuizAttemptsList } from './QuizAttemptsList';
import { Quiz } from '@/hooks/quizzes/useQuizSystem';

interface QuizForm {
  title: string;
  description: string;
  reward_coins: number;
  max_attempts: number;
  time_limit_minutes: number;
  questions: {
    question_text: string;
    correct_answer: string;
    points: number;
  }[];
}

export function SimpleManageQuizzes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState<string | null>(null);
  const [form, setForm] = useState<QuizForm>({
    title: '',
    description: '',
    reward_coins: 10,
    max_attempts: 1,
    time_limit_minutes: 10,
    questions: [{ question_text: '', correct_answer: '', points: 1 }]
  });

  // Hook para buscar todos os quizzes
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['all-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Quiz[];
    },
  });

  const selectedQuiz = quizzes?.find(q => q.id === selectedQuizForResults);

  if (selectedQuiz) {
    return (
      <QuizAttemptsList
        quiz={selectedQuiz}
        onBack={() => setSelectedQuizForResults(null)}
      />
    );
  }

  // Mutation para criar quiz
  const createMutation = useMutation({
    mutationFn: async (quizData: QuizForm) => {
      if (!profile?.id) throw new Error('Não autenticado');

      // Criar quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          reward_coins: quizData.reward_coins,
          max_attempts: quizData.max_attempts,
          time_limit_minutes: quizData.time_limit_minutes,
          created_by: profile.id,
          is_active: true
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Criar perguntas
      const questions = quizData.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        points: q.points,
        question_order: index,
        question_type: 'text'
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;

      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        reward_coins: 10,
        max_attempts: 1,
        time_limit_minutes: 10,
        questions: [{ question_text: '', correct_answer: '', points: 1 }]
      });
      toast.success('Quiz criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar quiz:', error);
      toast.error('Erro ao criar quiz');
    },
  });

  // Mutation para deletar quiz
  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      // Buscar IDs das tentativas
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quizId);

      const attemptIds = attempts?.map(a => a.id) || [];

      // Deletar respostas primeiro (se houver tentativas)
      if (attemptIds.length > 0) {
        await supabase
          .from('quiz_answers')
          .delete()
          .in('attempt_id', attemptIds);
      }

      // Deletar tentativas
      await supabase
        .from('quiz_attempts')
        .delete()
        .eq('quiz_id', quizId);

      // Deletar perguntas
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      // Deletar quiz
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      toast.success('Quiz deletado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar quiz:', error);
      toast.error('Erro ao deletar quiz');
    },
  });

  // Mutation para toggle ativo/inativo
  const toggleMutation = useMutation({
    mutationFn: async ({ quizId, isActive }: { quizId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !isActive })
        .eq('id', quizId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      toast.success('Status do quiz atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  const handleAddQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question_text: '', correct_answer: '', points: 1 }]
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (form.questions.some(q => !q.question_text.trim() || !q.correct_answer.trim())) {
      toast.error('Todas as perguntas devem ter texto e resposta');
      return;
    }

    createMutation.mutate(form);
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
        <h2 className="text-2xl font-bold">Gerenciar Quizzes</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Quiz
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título do quiz"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            />
            
            <Textarea
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Moedas de recompensa"
                value={form.reward_coins}
                onChange={(e) => setForm(prev => ({ ...prev, reward_coins: parseInt(e.target.value) || 10 }))}
              />
              <Input
                type="number"
                placeholder="Tentativas máximas"
                value={form.max_attempts}
                onChange={(e) => setForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
              />
              <Input
                type="number"
                placeholder="Tempo limite (min)"
                value={form.time_limit_minutes}
                onChange={(e) => setForm(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 10 }))}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Perguntas</h3>
              {form.questions.map((question, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pergunta {index + 1}</span>
                    {form.questions.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    placeholder="Texto da pergunta"
                    value={question.question_text}
                    onChange={(e) => {
                      const newQuestions = [...form.questions];
                      newQuestions[index].question_text = e.target.value;
                      setForm(prev => ({ ...prev, questions: newQuestions }));
                    }}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Resposta correta"
                      value={question.correct_answer}
                      onChange={(e) => {
                        const newQuestions = [...form.questions];
                        newQuestions[index].correct_answer = e.target.value;
                        setForm(prev => ({ ...prev, questions: newQuestions }));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Pontos"
                      value={question.points}
                      onChange={(e) => {
                        const newQuestions = [...form.questions];
                        newQuestions[index].points = parseInt(e.target.value) || 1;
                        setForm(prev => ({ ...prev, questions: newQuestions }));
                      }}
                    />
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={handleAddQuestion} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending ? 'Salvando...' : 'Salvar Quiz'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes?.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <Badge variant={quiz.is_active ? "default" : "secondary"}>
                  {quiz.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {quiz.description && (
                <p className="text-sm text-muted-foreground">{quiz.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>Recompensa:</strong> {quiz.reward_coins} moedas</p>
                {quiz.max_attempts && (
                  <p><strong>Tentativas:</strong> {quiz.max_attempts}</p>
                )}
                {quiz.time_limit_minutes && (
                  <p><strong>Tempo:</strong> {quiz.time_limit_minutes} min</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleMutation.mutate({ quizId: quiz.id, isActive: quiz.is_active })}
                  disabled={toggleMutation.isPending}
                >
                  {quiz.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedQuizForResults(quiz.id)}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(quiz.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {(!quizzes || quizzes.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Nenhum quiz criado ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}