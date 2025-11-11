import React from 'react';
import { QuizzesDashboard } from '../quizzes/QuizzesDashboard';
import { QuizNotifications } from '../notifications/QuizNotifications';

export function Quizzes() {
  console.log('🎯 Componente Quizzes carregado');
  
  return (
    <>
      <QuizNotifications />
      <QuizzesDashboard />
    </>
  );
}