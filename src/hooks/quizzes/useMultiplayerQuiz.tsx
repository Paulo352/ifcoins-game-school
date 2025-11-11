import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export interface QuizRoom {
  id: string;
  quiz_id: string;
  room_code: string;
  created_by: string;
  status: 'waiting' | 'active' | 'finished';
  max_players: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  quizzes?: {
    title: string;
    description: string;
  };
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  attempt_id: string | null;
  position: number | null;
  joined_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export function useActiveRooms() {
  return useQuery({
    queryKey: ['active-quiz-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .select(`
          *,
          quizzes(title, description)
        `)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as QuizRoom[];
    }
  });
}

export function useRoom(roomId: string | null) {
  return useQuery({
    queryKey: ['quiz-room', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('quiz_rooms')
        .select(`
          *,
          quizzes(title, description, time_limit_minutes)
        `)
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data as QuizRoom;
    },
    enabled: !!roomId
  });
}

export function useRoomPlayers(roomId: string | null) {
  const [players, setPlayers] = useState<RoomPlayer[]>([]);

  useQuery({
    queryKey: ['room-players', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('quiz_room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setPlayers(data as any);
      return data as any;
    },
    enabled: !!roomId
  });

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-players-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_room_players',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          // Recarregar players
          const { data } = await supabase
            .from('quiz_room_players')
            .select('*')
            .eq('room_id', roomId)
            .order('joined_at', { ascending: true });

          if (data) setPlayers(data as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { players };
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, maxPlayers }: { quizId: string; maxPlayers: number }) => {
      // Gerar código da sala
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw codeError;

      const roomCode = codeData;

      // Criar sala
      const { data, error } = await supabase
        .from('quiz_rooms')
        .insert([{
          quiz_id: quizId,
          room_code: roomCode,
          max_players: maxPlayers
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-quiz-rooms'] });
      toast.success('Sala criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar sala:', error);
      toast.error('Erro ao criar sala');
    }
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('quiz_room_players')
        .insert({
          room_id: roomId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
      toast.success('Você entrou na sala!');
    },
    onError: (error: any) => {
      console.error('Erro ao entrar na sala:', error);
      toast.error('Erro ao entrar na sala');
    }
  });
}

export function useStartRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-room'] });
      toast.success('Quiz iniciado!');
    },
    onError: (error: any) => {
      console.error('Erro ao iniciar sala:', error);
      toast.error('Erro ao iniciar sala');
    }
  });
}

export function useUpdatePlayerPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      playerId, 
      position, 
      attemptId 
    }: { 
      playerId: string; 
      position: number;
      attemptId: string;
    }) => {
      const { data, error } = await supabase
        .from('quiz_room_players')
        .update({
          position,
          attempt_id: attemptId
        })
        .eq('id', playerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar posição:', error);
    }
  });
}
