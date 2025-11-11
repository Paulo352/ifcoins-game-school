import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCardAchievements() {
  return useQuery({
    queryKey: ['card-achievements'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('card_achievements')
        .select('*, reward_card:cards(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function useUserCardAchievements(userId?: string) {
  return useQuery({
    queryKey: ['user-card-achievements', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_card_achievements')
        .select(`
          *,
          achievement:card_achievements(*, reward_card:cards(*))
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
}

export function useCreateCardAchievement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (achievement: {
      name: string;
      description: string;
      objective_type: string;
      objective_value: number;
      reward_card_id: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await (supabase as any)
        .from('card_achievements')
        .insert([{ ...achievement, created_by: userData.user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-achievements'] });
      toast.success('Conquista criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar conquista');
    }
  });
}

export function useCheckAndUnlockAchievements() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Get user stats
      const [quizzesResult, cardsResult] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('score')
          .eq('user_id', userId)
          .eq('is_completed', true),
        supabase
          .from('user_cards')
          .select('card_id')
          .eq('user_id', userId)
      ]);
      
      const totalQuizzes = quizzesResult.data?.length || 0;
      const totalScore = quizzesResult.data?.reduce((sum, a) => sum + (a.score || 0), 0) || 0;
      const totalCards = cardsResult.data?.length || 0;
      
      // Get all active achievements
      const { data: achievements } = await (supabase as any)
        .from('card_achievements')
        .select('*')
        .eq('is_active', true);
      
      if (!achievements) return;
      
      // Check each achievement
      for (const achievement of achievements) {
        let unlocked = false;
        
        switch ((achievement as any).objective_type) {
          case 'quizzes_completed':
            unlocked = totalQuizzes >= (achievement as any).objective_value;
            break;
          case 'total_score':
            unlocked = totalScore >= (achievement as any).objective_value;
            break;
          case 'cards_collected':
            unlocked = totalCards >= (achievement as any).objective_value;
            break;
        }
        
        if (unlocked) {
          // Try to unlock (will fail silently if already unlocked due to unique constraint)
          const { error: unlockError } = await (supabase as any)
            .from('user_card_achievements')
            .insert([{ user_id: userId, achievement_id: (achievement as any).id }]);
          
          if (!unlockError) {
            // Give the reward card
            await supabase
              .from('user_cards')
              .insert([{ user_id: userId, card_id: (achievement as any).reward_card_id, quantity: 1 }])
              .select()
              .single();
            
            toast.success(`🎉 Conquista desbloqueada: ${(achievement as any).name}!`);
          }
        }
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['user-card-achievements', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
    }
  });
}
