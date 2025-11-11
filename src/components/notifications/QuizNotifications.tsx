import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

export function QuizNotifications() {
  const { profile, user } = useAuth();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'student') return;

    // Subscrever a novos quizzes
    const channel = supabase
      .channel('new-quizzes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quizzes',
          filter: `is_active=eq.true`
        },
        (payload) => {
          const newQuiz = payload.new as any;
          
          // Mostrar notificação toast
          toast(newQuiz.title, {
            description: 'Novo quiz disponível! Clique para começar.',
            icon: <BookOpen className="w-5 h-5" />,
            duration: 8000,
            action: {
              label: 'Ver Quiz',
              onClick: () => {
                // Navegar para a página de quizzes
                window.location.hash = '#/quizzes';
              }
            }
          });

          // Criar notificação no banco
          supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'new_quiz',
              title: 'Novo Quiz Disponível',
              message: `O quiz "${newQuiz.title}" está disponível agora!`
            })
            .then(() => console.log('✅ Notificação de quiz salva'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return null; // Componente invisível
}
