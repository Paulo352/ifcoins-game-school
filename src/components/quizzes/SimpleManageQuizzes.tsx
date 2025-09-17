import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    question_type: 'multiple_choice' | 'true_false' | 'open_text';
    options?: string[];
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
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [form, setForm] = useState<QuizForm>({
    title: '',
    description: '',
    reward_coins: 10,
    max_attempts: 1,
    time_limit_minutes: 10,
    questions: [{ 
      question_text: '', 
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '', 
      points: 1 
    }]
  });

  console.log('🎯 [SimpleManageQuizzes] Renderizando - Profile:', profile?.role, 'selectedQuizForResults:', selectedQuizForResults);

  // Hook para buscar todos os quizzes
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['all-quizzes'],
    queryFn: async () => {
      console.log('🎯 [SimpleManageQuizzes] Buscando todos os quizzes...');
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [SimpleManageQuizzes] Erro ao buscar quizzes:', error);
        throw error;
      }
      
      console.log('✅ [SimpleManageQuizzes] Quizzes encontrados:', data?.length || 0, data);
      return data as Quiz[];
    },
  });

  const selectedQuiz = quizzes?.find(q => q.id === selectedQuizForResults);
  
  console.log('🎯 [SimpleManageQuizzes] Quiz selecionado para resultados:', selectedQuiz?.title);

  if (selectedQuiz) {
    console.log('🎯 [SimpleManageQuizzes] Renderizando QuizAttemptsList para quiz:', selectedQuiz.title);
    return (
      <QuizAttemptsList
        quiz={selectedQuiz}
        onBack={() => {
          console.log('🎯 [SimpleManageQuizzes] Voltando da visualização de resultados');
          setSelectedQuizForResults(null);
        }}
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
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options?.filter(opt => opt.trim()) : null,
        correct_answer: q.correct_answer,
        points: q.points,
        question_order: index
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
      resetForm();
      toast.success('Quiz criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar quiz:', error);
      toast.error('Erro ao criar quiz');
    },
  });

  // Mutation para atualizar quiz
  const updateMutation = useMutation({
    mutationFn: async ({ quizId, quizData }: { quizId: string; quizData: QuizForm }) => {
      if (!profile?.id) throw new Error('Não autenticado');

      // Atualizar dados do quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: quizData.title,
          description: quizData.description,
          reward_coins: quizData.reward_coins,
          max_attempts: quizData.max_attempts,
          time_limit_minutes: quizData.time_limit_minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId);

      if (quizError) throw quizError;

      // Deletar perguntas antigas
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      // Inserir novas perguntas
      const questions = quizData.questions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options?.filter(opt => opt.trim()) : null,
        correct_answer: q.correct_answer,
        points: q.points,
        question_order: index
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      setEditingQuiz(null);
      setShowForm(false);
      resetForm();
      toast.success('Quiz atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar quiz:', error);
      toast.error('Erro ao atualizar quiz');
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

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      reward_coins: 10,
      max_attempts: 1,
      time_limit_minutes: 10,
      questions: [{
        question_text: '', 
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '', 
        points: 1 
      }]
    });
  };

  const handleAddQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { 
        question_text: '', 
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '', 
        points: 1 
      }]
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    console.log('🎯 [SimpleManageQuizzes] Iniciando edição do quiz:', quiz);
    setEditingQuiz(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description || '',
      reward_coins: quiz.reward_coins,
      max_attempts: quiz.max_attempts || 1,
      time_limit_minutes: quiz.time_limit_minutes || 10,
      questions: [{ 
        question_text: '', 
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '', 
        points: 1 
      }] // Será preenchido após carregar as perguntas
    });
    setShowForm(true);
    
    console.log('🎯 [SimpleManageQuizzes] Buscando perguntas do quiz:', quiz.id);
    
    // Buscar perguntas e preencher o formulário
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('question_order', { ascending: true });

    if (error) {
      console.error('❌ [SimpleManageQuizzes] Erro ao buscar perguntas:', error);
      return;
    }

    console.log('✅ [SimpleManageQuizzes] Perguntas encontradas:', questions?.length || 0, questions);

    if (questions && questions.length > 0) {
      setForm(prev => ({
        ...prev,
        questions: questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type as 'multiple_choice' | 'true_false' | 'open_text',
          options: q.options && Array.isArray(q.options) 
            ? q.options.map(opt => String(opt)) 
            : ['', '', '', ''],
          correct_answer: q.correct_answer,
          points: q.points
        }))
      }));
    }
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

    if (editingQuiz) {
      updateMutation.mutate({ quizId: editingQuiz.id, quizData: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuiz(null);
    setShowForm(false);
    resetForm();
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
        <Button onClick={() => { setEditingQuiz(null); setShowForm(!showForm); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Quiz
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingQuiz ? 'Editar Quiz' : 'Criar Novo Quiz'}</CardTitle>
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">Moedas de Recompensa</label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={form.reward_coins}
                  onChange={(e) => setForm(prev => ({ ...prev, reward_coins: parseInt(e.target.value) || 10 }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Quantidade de moedas que o estudante receberá ao completar o quiz</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tentativas Máximas</label>
                <Input
                  type="number"
                  placeholder="Ex: 1"
                  value={form.max_attempts}
                  onChange={(e) => setForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Número máximo de tentativas permitidas por estudante</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tempo Limite (minutos)</label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={form.time_limit_minutes}
                  onChange={(e) => setForm(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 10 }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Tempo máximo em minutos para completar o quiz</p>
              </div>
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
                  
                  {/* Tipo de pergunta */}
                  <div>
                    <label className="text-sm font-medium">Tipo da Pergunta</label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value: 'multiple_choice' | 'true_false' | 'open_text') => {
                        const newQuestions = [...form.questions];
                        newQuestions[index].question_type = value;
                        // Resetar opções baseado no tipo
                        if (value === 'multiple_choice') {
                          newQuestions[index].options = ['', '', '', ''];
                        } else {
                          newQuestions[index].options = undefined;
                        }
                        setForm(prev => ({ ...prev, questions: newQuestions }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                        <SelectItem value="open_text">Texto Aberto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Opções para múltipla escolha */}
                  {question.question_type === 'multiple_choice' && (
                    <div>
                      <label className="text-sm font-medium">Opções de Resposta</label>
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            placeholder={`Opção ${String.fromCharCode(65 + optionIndex)}`}
                            value={option}
                            onChange={(e) => {
                              const newQuestions = [...form.questions];
                              if (newQuestions[index].options) {
                                newQuestions[index].options![optionIndex] = e.target.value;
                                setForm(prev => ({ ...prev, questions: newQuestions }));
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campo de resposta correta adaptado */}
                  {question.question_type === 'true_false' ? (
                    <div>
                      <label className="text-sm font-medium">Resposta Correta</label>
                      <Select
                        value={question.correct_answer}
                        onValueChange={(value) => {
                          const newQuestions = [...form.questions];
                          newQuestions[index].correct_answer = value;
                          setForm(prev => ({ ...prev, questions: newQuestions }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a resposta correta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Verdadeiro</SelectItem>
                          <SelectItem value="false">Falso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium">
                        {question.question_type === 'multiple_choice' 
                          ? 'Resposta Correta (digite exatamente como nas opções)' 
                          : 'Resposta Correta'
                        }
                      </label>
                      <Input
                        placeholder={
                          question.question_type === 'multiple_choice'
                            ? "Digite exatamente como aparece nas opções"
                            : "Resposta esperada"
                        }
                        value={question.correct_answer}
                        onChange={(e) => {
                          const newQuestions = [...form.questions];
                          newQuestions[index].correct_answer = e.target.value;
                          setForm(prev => ({ ...prev, questions: newQuestions }));
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-2">
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
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingQuiz 
                  ? (updateMutation.isPending ? 'Atualizando...' : 'Atualizar Quiz')
                  : (createMutation.isPending ? 'Salvando...' : 'Salvar Quiz')
                }
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
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
                  onClick={() => handleEditQuiz(quiz)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    console.log('🎯 [SimpleManageQuizzes] Visualizando resultados do quiz:', quiz.id, quiz.title);
                    setSelectedQuizForResults(quiz.id);
                  }}
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