import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMatchHistory(userId?: string) {
  return useQuery({
    queryKey: ['match-history', userId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('multiplayer_match_history')
        .select(`
          *,
          quiz:quizzes(title),
          winner:profiles!multiplayer_match_history_winner_id_fkey(name)
        `)
        .order('finished_at', { ascending: false });
      
      if (userId) {
        // Filter matches where user participated
        const { data: participations } = await supabase
          .from('quiz_room_players')
          .select('room_id')
          .eq('user_id', userId);
        
        const roomIds = participations?.map(p => p.room_id) || [];
        query = query.in('room_id', roomIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}

export function useMatchDetails(matchId: string) {
  return useQuery({
    queryKey: ['match-details', matchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('multiplayer_match_history')
        .select(`
          *,
          quiz:quizzes(title, quiz_questions(*)),
          winner:profiles!multiplayer_match_history_winner_id_fkey(name, email)
        `)
        .eq('id', matchId)
        .single();
      
      if (error) throw error;
      
      // Get all participants
      const { data: players } = await supabase
        .from('quiz_room_players')
        .select('*, profiles(name, email), quiz_attempts(score, correct_answers)')
        .eq('room_id', (data as any).room_id);
      
      return {
        ...data,
        players
      };
    },
    enabled: !!matchId
  });
}

export function useSaveMatchHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      roomId,
      quizId,
      winnerId,
      startedAt,
      finishedAt,
      totalPlayers,
      matchData
    }: {
      roomId: string;
      quizId: string;
      winnerId: string;
      startedAt: Date;
      finishedAt: Date;
      totalPlayers: number;
      matchData: any;
    }) => {
      const { error } = await (supabase as any)
        .from('multiplayer_match_history')
        .insert([{
          room_id: roomId,
          quiz_id: quizId,
          winner_id: winnerId,
          started_at: startedAt.toISOString(),
          finished_at: finishedAt.toISOString(),
          total_players: totalPlayers,
          match_data: matchData
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-history'] });
    }
  });
}
