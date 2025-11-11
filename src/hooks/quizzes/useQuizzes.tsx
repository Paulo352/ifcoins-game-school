// Re-export all hooks from modular files
export { useActiveQuizzes, useQuizQuestions, useCreateQuiz, useDeleteQuiz, useUpdateQuizStatus } from './useQuizManagement';
export { useUserAttempts, useStartQuizAttempt, useCompleteQuiz, useAttemptAnswers, useAllQuizAttempts } from './useQuizAttempts';
export { useValidateAnswer } from './useQuizValidation';

// Re-export types
export type { Quiz, QuizQuestion, CreateQuizData } from './useQuizManagement';
export type { QuizAttempt } from './useQuizAttempts';
