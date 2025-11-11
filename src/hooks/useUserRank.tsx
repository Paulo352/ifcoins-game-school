import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserRank(userId?: string) {
  return useQuery({
    queryKey: ['user-rank', userId],
    queryFn: async () => {
      const { data: rank, error: rankError } = await supabase
        .from('user_ranks')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const { data: thresholds, error: thresholdError } = await supabase
        .from('rank_thresholds')
        .select('*')
        .order('min_points', { ascending: true });
      
      if (rankError && rankError.code !== 'PGRST116') throw rankError;
      if (thresholdError) throw thresholdError;

      return {
        rank: rank || {
          current_rank: 'iniciante',
          total_points: 0,
          quizzes_completed: 0,
          badges_earned: 0
        },
        thresholds: thresholds || []
      };
    },
    enabled: !!userId
  });
}

export function useRankProgress(userId?: string) {
  const { data } = useUserRank(userId);
  
  if (!data) return null;

  const currentThreshold = data.thresholds.find(t => t.rank_name === data.rank.current_rank);
  const nextThreshold = data.thresholds.find(t => 
    t.min_points > (data.rank.total_points || 0)
  );

  if (!currentThreshold) return null;

  const progressToNext = nextThreshold ? {
    pointsProgress: ((data.rank.total_points || 0) / nextThreshold.min_points) * 100,
    quizzesProgress: ((data.rank.quizzes_completed || 0) / nextThreshold.min_quizzes) * 100,
    badgesProgress: ((data.rank.badges_earned || 0) / nextThreshold.min_badges) * 100,
    pointsNeeded: nextThreshold.min_points - (data.rank.total_points || 0),
    quizzesNeeded: nextThreshold.min_quizzes - (data.rank.quizzes_completed || 0),
    badgesNeeded: nextThreshold.min_badges - (data.rank.badges_earned || 0),
    nextRank: nextThreshold.rank_name
  } : null;

  return {
    currentRank: data.rank.current_rank,
    currentThreshold,
    nextThreshold,
    progressToNext
  };
}
