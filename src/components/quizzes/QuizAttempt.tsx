import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { 
  Quiz, 
  QuizQuestion, 
  useQuizQuestions, 
  useStartQuizAttempt, 
  useAnswerQuestion, 
  useCompleteQuiz 
} from '@/hooks/quizzes/useQuizzes';

interface QuizAttemptProps {
  quiz: Quiz;
  userId: string;
  onComplete: () => void;
}

export function QuizAttempt({ quiz, userId, onComplete }: QuizAttemptProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [results, setResults] = useState<Record<string, { correct: boolean; points: number }>>({});

  const { data: questions, isLoading } = useQuizQuestions(quiz.id);
  const startAttempt = useStartQuizAttempt();
  const answerQuestion = useAnswerQuestion();
  const completeQuiz = useCompleteQuiz();

  // Timer effect
  useEffect(() => {
    if (quiz.time_limit_minutes && timeLeft !== null && timeLeft > 0 && quizStarted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleCompleteQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, quizStarted, quiz.time_limit_minutes]);

  const handleStartQuiz = async () => {
    if (!questions?.length) return;

    try {
      const attempt = await startAttempt.mutateAsync({
        quizId: quiz.id,
        userId,
        totalQuestions: questions.length
      });
      
      setAttemptId(attempt.id);
      setQuizStarted(true);
      
      if (quiz.time_limit_minutes) {
        setTimeLeft(quiz.time_limit_minutes * 60);
      }
    } catch (error) {
      console.error('Erro ao iniciar quiz:', error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = async () => {
    if (!questions || !attemptId) return;

    const question = questions[currentQuestion];
    const userAnswer = answers[question.id];

    if (!userAnswer) return;

    try {
      const result = await answerQuestion.mutateAsync({
        attemptId,
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correct_answer,
        points: question.points
      });

      setResults(prev => ({
        ...prev,
        [question.id]: {
          correct: result.isCorrect,
          points: result.pointsEarned
        }
      }));

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleCompleteQuiz();
      }
    } catch (error) {
      console.error('Erro ao responder pergunta:', error);
    }
  };

  const handleCompleteQuiz = async () => {
    if (!attemptId) return;

    try {
      await completeQuiz.mutateAsync({ attemptId, userId });
      onComplete();
    } catch (error) {
      console.error('Erro ao completar quiz:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Este quiz não possui perguntas.</p>
        </CardContent>
      </Card>
    );
  }

  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Recompensa: {quiz.reward_coins} moedas</span>
            </div>
            
            {quiz.time_limit_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Tempo: {quiz.time_limit_minutes} minutos</span>
              </div>
            )}
            
            <div>
              <span>Perguntas: {questions.length}</span>
            </div>
            
            <div>
              <span>Pontuação mínima: 70%</span>
            </div>
          </div>

          <Button 
            onClick={handleStartQuiz} 
            disabled={startAttempt.isPending}
            className="w-full"
          >
            {startAttempt.isPending ? 'Iniciando...' : 'Iniciar Quiz'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = answers[question.id] || '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {quiz.title}
          </CardTitle>
          {timeLeft !== null && (
            <Badge variant={timeLeft < 60 ? 'destructive' : 'default'}>
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pergunta {currentQuestion + 1} de {questions.length}</span>
            <span>{question.points} ponto{question.points !== 1 ? 's' : ''}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question_text}</h3>

          {question.question_type === 'multiple_choice' && question.options && (
            <RadioGroup
              value={currentAnswer}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.question_type === 'true_false' && (
            <RadioGroup
              value={currentAnswer}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">Verdadeiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">Falso</Label>
              </div>
            </RadioGroup>
          )}

          {question.question_type === 'open_text' && (
            <Input
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Digite sua resposta..."
              className="w-full"
            />
          )}
        </div>

        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            {Object.entries(results).map(([questionId, result]) => (
              <div key={questionId} className="w-2 h-2 rounded-full">
                {result.correct ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={!currentAnswer || answerQuestion.isPending}
          >
            {answerQuestion.isPending ? 'Salvando...' : 
             currentQuestion === questions.length - 1 ? 'Finalizar Quiz' : 'Próxima Pergunta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}