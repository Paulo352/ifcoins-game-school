import React, { useState, useEffect } from 'react';
import { useQuizQuestions, useAnswerQuestion, useCompleteQuiz, type Quiz, type QuizQuestion } from '@/hooks/quizzes/useQuizSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { QuizResults } from './QuizResults';
import { QuizTimer } from './QuizTimer';

interface QuizSystemAttemptProps {
  quiz: Quiz;
  attemptId: string;
  userId: string;
  onComplete: () => void;
  onBack: () => void;
  practiceMode?: boolean;
}

export function QuizSystemAttempt({ 
  quiz, 
  attemptId, 
  userId, 
  onComplete, 
  onBack,
  practiceMode = false
}: QuizSystemAttemptProps) {
  const { data: questions, isLoading } = useQuizQuestions(quiz.id);
  const answerMutation = useAnswerQuestion();
  const completeMutation = useCompleteQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionResults, setQuestionResults] = useState<Record<string, boolean>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState<{
    correctAnswers: number;
    totalQuestions: number;
    coinsEarned: number;
    passed: boolean;
  } | null>(null);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || !quiz.time_limit_minutes) return;

    setTimeLeft(quiz.time_limit_minutes * 60);
  }, [quizStarted, quiz.time_limit_minutes]);

  const handleTimeUp = () => {
    handleCompleteQuiz();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion || !answers[currentQuestion.id]) return;

    const userAnswer = answers[currentQuestion.id];
    
    try {
      console.log('📝 Salvando resposta da pergunta:', currentQuestionIndex + 1);
      
      const result = await answerMutation.mutateAsync({
        attemptId,
        questionId: currentQuestion.id,
        userAnswer,
        correctAnswer: currentQuestion.correct_answer,
        points: currentQuestion.points
      });

      setQuestionResults(prev => ({
        ...prev,
        [currentQuestion.id]: result.isCorrect
      }));

      if (currentQuestionIndex < (questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Última pergunta - finalizar quiz
        console.log('✅ Última pergunta respondida, finalizando quiz...');
        await handleCompleteQuiz();
      }
    } catch (error) {
      console.error('❌ Erro ao responder pergunta:', error);
      // Mesmo com erro, permitir finalização se for a última pergunta
      if (currentQuestionIndex === (questions?.length || 0) - 1) {
        console.log('⚠️ Erro ao salvar resposta, mas finalizando quiz mesmo assim...');
        await handleCompleteQuiz();
      }
    }
  };

  const handleCompleteQuiz = async () => {
    if (completeMutation.isPending) {
      console.log('⏳ Já está completando o quiz, aguarde...');
      return;
    }

    try {
      console.log('🏁 Finalizando quiz, attemptId:', attemptId);
      const result = await completeMutation.mutateAsync({ attemptId });
      
      console.log('✅ Quiz completado com sucesso:', result);
      
      setFinalResults({
        correctAnswers: result.correct_answers || 0,
        totalQuestions: result.total_questions || questions?.length || 0,
        coinsEarned: result.coins_earned || 0,
        passed: result.passed || false
      });
      setQuizCompleted(true);
    } catch (error: any) {
      console.error('❌ Erro ao completar quiz:', error);
      
      // Mesmo com erro, mostrar resultados parciais
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

  const renderQuestionOptions = (question: QuizQuestion) => {
    if (question.question_type === 'multiple_choice' && question.options) {
      // Handle both array and object options
      if (Array.isArray(question.options)) {
        return (
          <RadioGroup 
            value={answers[question.id] || ''} 
            onValueChange={handleAnswerChange}
          >
            {question.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      } else if (typeof question.options === 'object') {
        return (
          <RadioGroup 
            value={answers[question.id] || ''} 
            onValueChange={handleAnswerChange}
          >
            {Object.entries(question.options).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={String(value)} id={key} />
                <Label htmlFor={key}>{String(value)}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      }
    }

    if (question.question_type === 'true_false') {
      return (
        <RadioGroup 
          value={answers[question.id] || ''} 
          onValueChange={handleAnswerChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Verdadeiro" id="true" />
            <Label htmlFor="true">Verdadeiro</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Falso" id="false" />
            <Label htmlFor="false">Falso</Label>
          </div>
        </RadioGroup>
      );
    }

    // Open text question
    return (
      <Input
        placeholder="Digite sua resposta..."
        value={answers[question.id] || ''}
        onChange={(e) => handleAnswerChange(e.target.value)}
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma pergunta encontrada para este quiz.</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
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
                ℹ️ No modo prática, você pode refazer o quiz quantas vezes quiser, mas não ganhará moedas ou badges.
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

  // Mostrar resultados se o quiz foi completado
  if (quizCompleted && finalResults) {
    return (
      <QuizResults
        correctAnswers={finalResults.correctAnswers}
        totalQuestions={finalResults.totalQuestions}
        coinsEarned={finalResults.coinsEarned}
        passed={finalResults.passed}
        questions={questions}
        userAnswers={answers}
        practiceMode={practiceMode}
        onBack={() => {
          setQuizCompleted(false);
          setFinalResults(null);
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com progresso e timer */}
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
        
        {timeLeft !== null && quiz.time_limit_minutes && (
          <QuizTimer 
            totalSeconds={quiz.time_limit_minutes * 60} 
            onTimeUp={handleTimeUp}
          />
        )}
      </div>

      {/* Pergunta atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{currentQuestion?.question_text}</span>
            {currentQuestion && questionResults[currentQuestion.id] !== undefined && (
              questionResults[currentQuestion.id] ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentQuestion && renderQuestionOptions(currentQuestion)}

          <div className="flex gap-2 pt-4">
            {currentQuestionIndex === (questions.length - 1) ? (
              <Button 
                onClick={handleNextQuestion}
                disabled={!answers[currentQuestion?.id || ''] || answerMutation.isPending}
                className="flex-1"
              >
                {answerMutation.isPending ? 'Finalizando...' : 'Finalizar Quiz'}
              </Button>
            ) : (
              <Button 
                onClick={handleNextQuestion}
                disabled={!answers[currentQuestion?.id || ''] || answerMutation.isPending}
                className="flex-1"
              >
                {answerMutation.isPending ? 'Salvando...' : 'Próxima Pergunta'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}