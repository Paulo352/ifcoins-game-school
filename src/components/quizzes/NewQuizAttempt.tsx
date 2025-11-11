import React, { useState, useEffect } from 'react';
import { useQuizQuestions, type Quiz, type QuizQuestion } from '@/hooks/quizzes/useQuizManagement';
import { useValidateAnswer } from '@/hooks/quizzes/useQuizValidation';
import { useCompleteQuiz } from '@/hooks/quizzes/useQuizAttempts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GraduationCap, Loader2 } from 'lucide-react';
import { QuizResults } from './QuizResults';
import { QuizTimer } from './QuizTimer';
import { toast } from 'sonner';

interface NewQuizAttemptProps {
  quiz: Quiz;
  attemptId: string;
  userId: string;
  practiceMode: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function NewQuizAttempt({ 
  quiz, 
  attemptId, 
  userId, 
  practiceMode,
  onComplete, 
  onBack 
}: NewQuizAttemptProps) {
  const { data: questions, isLoading } = useQuizQuestions(quiz.id);
  const validateMutation = useValidateAnswer();
  const completeMutation = useCompleteQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionResults, setQuestionResults] = useState<Record<string, boolean>>({});
  const [allAnswers, setAllAnswers] = useState<Record<string, string>>({});
  const [finalResults, setFinalResults] = useState<any>(null);

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === (questions?.length || 0) - 1;

  useEffect(() => {
    // Limpar resposta ao mudar de pergunta
    setCurrentAnswer('');
  }, [currentQuestionIndex]);

  const handleTimeUp = async () => {
    toast.warning('Tempo esgotado! Finalizando quiz...');
    await handleCompleteQuiz();
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !currentAnswer.trim()) {
      toast.error('Por favor, selecione uma resposta');
      return;
    }

    try {
      console.log('📝 Enviando resposta:', {
        questionIndex: currentQuestionIndex + 1,
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        isLastQuestion
      });

      // Validar resposta via RPC server-side
      const result = await validateMutation.mutateAsync({
        attemptId,
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        userId
      });

      console.log('✅ Resposta validada:', {
        isCorrect: result.is_correct,
        pointsEarned: result.points_earned
      });

      // Salvar resultado
      setQuestionResults(prev => ({
        ...prev,
        [currentQuestion.id]: result.is_correct
      }));

      setAllAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer
      }));

      // Se for a última pergunta, finalizar após pequeno delay
      if (isLastQuestion) {
        console.log('🏁 Última pergunta respondida, finalizando quiz...');
        // Dar um pequeno delay para garantir que a resposta foi salva
        setTimeout(async () => {
          await handleCompleteQuiz();
        }, 500);
      } else {
        // Próxima pergunta
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('❌ Erro ao validar resposta:', error);
      toast.error(error.message || 'Erro ao enviar resposta');
    }
  };

  const handleCompleteQuiz = async () => {
    if (completeMutation.isPending) {
      console.log('⏳ Quiz já está sendo finalizado, aguarde...');
      return;
    }

    try {
      console.log('🏁 Iniciando finalização do quiz', { attemptId, userId });
      
      const result = await completeMutation.mutateAsync({ attemptId, userId });
      
      console.log('✅ Quiz finalizado com sucesso:', result);
      
      // Garantir que usamos os dados corretos do servidor
      const finalData = {
        correctAnswers: Number(result.correct_answers) || 0,
        totalQuestions: Number(result.total_questions) || questions?.length || 0,
        coinsEarned: Number(result.coins_earned) || 0,
        passed: Boolean(result.passed)
      };
      
      console.log('📊 Dados finais processados:', finalData);
      
      setFinalResults(finalData);
      setQuizCompleted(true);
    } catch (error: any) {
      console.error('❌ Erro ao finalizar quiz:', error);
      toast.error('Erro ao finalizar quiz: ' + (error.message || 'Erro desconhecido'));
      
      // Mostrar resultados parciais baseados no que foi salvo
      const correctCount = Object.values(questionResults).filter(Boolean).length;
      setFinalResults({
        correctAnswers: correctCount,
        totalQuestions: questions?.length || 0,
        coinsEarned: 0,
        passed: false
      });
      setQuizCompleted(true);
    }
  };

  const renderQuestionInput = (question: QuizQuestion) => {
    if (question.question_type === 'multiple_choice' && question.options) {
      const options = Array.isArray(question.options) 
        ? question.options 
        : Object.values(question.options);

      return (
        <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
          {options.map((option: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (question.question_type === 'true_false') {
      return (
        <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Verdadeiro" id="true" />
            <Label htmlFor="true" className="cursor-pointer">Verdadeiro</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Falso" id="false" />
            <Label htmlFor="false" className="cursor-pointer">Falso</Label>
          </div>
        </RadioGroup>
      );
    }

    return (
      <Input
        placeholder="Digite sua resposta..."
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && currentAnswer.trim()) {
            handleAnswerSubmit();
          }
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nenhuma pergunta encontrada para este quiz.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tela inicial
  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              {practiceMode && (
                <Badge variant="secondary" className="gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Modo Prática
                </Badge>
              )}
              {quiz.title}
            </span>
            <Badge variant="outline">
              {practiceMode ? '0 moedas (prática)' : `${quiz.reward_coins} moedas`}
            </Badge>
          </CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
          {practiceMode && (
            <div className="mt-2 p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ℹ️ No modo prática, você pode refazer o quiz sem ganhar moedas.
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Total de perguntas:</strong> {questions.length}</p>
            {quiz.time_limit_minutes && (
              <p><strong>Tempo limite:</strong> {quiz.time_limit_minutes} minutos</p>
            )}
            <p><strong>Pontuação mínima:</strong> 70% para ganhar moedas</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setQuizStarted(true)} className="flex-1">
              Começar Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tela de resultados
  if (quizCompleted && finalResults) {
    return (
      <QuizResults
        correctAnswers={finalResults.correctAnswers}
        totalQuestions={finalResults.totalQuestions}
        coinsEarned={finalResults.coinsEarned}
        passed={finalResults.passed}
        questions={questions}
        userAnswers={allAnswers}
        practiceMode={practiceMode}
        onBack={() => {
          setQuizCompleted(false);
          setFinalResults(null);
          onComplete();
        }}
      />
    );
  }

  // Tela do quiz em andamento
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          {practiceMode && (
            <Badge variant="secondary" className="gap-1">
              <GraduationCap className="w-4 h-4" />
              Modo Prática
            </Badge>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        
        {quiz.time_limit_minutes && (
          <QuizTimer 
            totalSeconds={quiz.time_limit_minutes * 60} 
            onTimeUp={handleTimeUp}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion?.question_text}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentQuestion && renderQuestionInput(currentQuestion)}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAnswerSubmit}
              disabled={!currentAnswer.trim() || validateMutation.isPending || completeMutation.isPending}
              className="flex-1"
            >
              {validateMutation.isPending || completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLastQuestion ? 'Finalizando...' : 'Salvando...'}
                </>
              ) : (
                isLastQuestion ? 'Finalizar Quiz' : 'Próxima Pergunta'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
