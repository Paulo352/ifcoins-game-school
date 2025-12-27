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
  reward_type: 'coins' | 'card' | 'external' | 'none';
  reward_coins_1st: number;
  reward_coins_2nd: number;
  reward_coins_3rd: number;
  reward_card_id: string | null;
  reward_external_description: string | null;
  time_per_question_seconds: number;
  current_question_index: number;
  question_started_at: string | null;
  rewards_distributed: boolean;
  class_id: string | null;
  quizzes?: {
    title: string;
    description: string;
    time_limit_minutes?: number;
  };
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  attempt_id: string | null;
  position: number | null;
  joined_at: string;
  score: number;
  correct_answers: number;
  finished_at: string | null;
  current_question_index: number;
  profiles?: {
    name: string;
    email: string;
  };
}

// Hook para buscar salas ativas - só mostra salas do professor para alunos entrarem
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
      return data as unknown as QuizRoom[];
    }
  });
}

// Hook para buscar uma sala específica com realtime
export function useRoom(roomId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
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
      return data as unknown as QuizRoom;
    },
    enabled: !!roomId
  });

  // Realtime para mudanças na sala
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_rooms',
          filter: `id=eq.${roomId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['quiz-room', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
}

// Hook para jogadores da sala com realtime
export function useRoomPlayers(roomId: string | null) {
  const queryClient = useQueryClient();
  const [players, setPlayers] = useState<RoomPlayer[]>([]);

  const fetchPlayers = async () => {
    if (!roomId) return [];

    const { data, error } = await supabase
      .from('quiz_room_players')
      .select(`
        *,
        profiles(name, email)
      `)
      .eq('room_id', roomId)
      .order('score', { ascending: false });

    if (error) {
      console.error('Erro ao buscar jogadores:', error);
      return [];
    }
    return data as unknown as RoomPlayer[];
  };

  const query = useQuery({
    queryKey: ['room-players', roomId],
    queryFn: fetchPlayers,
    enabled: !!roomId,
    refetchInterval: 3000, // Polling a cada 3 segundos como backup
  });

  // Atualizar state quando query mudar
  useEffect(() => {
    if (query.data) {
      setPlayers(query.data);
    }
  }, [query.data]);

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
        async (payload) => {
          console.log('Realtime player update:', payload);
          // Refetch players quando houver mudança
          const newPlayers = await fetchPlayers();
          setPlayers(newPlayers);
          queryClient.invalidateQueries({ queryKey: ['room-players', roomId] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return { players, isLoading: query.isLoading, refetch: query.refetch };
}

// Hook para criar sala (só professor/admin)
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      quizId, 
      maxPlayers, 
      classId,
      rewardType,
      rewardCoins1st,
      rewardCoins2nd,
      rewardCoins3rd,
      rewardCardId,
      rewardExternalDescription,
      timePerQuestion
    }: { 
      quizId: string; 
      maxPlayers: number;
      classId?: string;
      rewardType: 'coins' | 'card' | 'external' | 'none';
      rewardCoins1st?: number;
      rewardCoins2nd?: number;
      rewardCoins3rd?: number;
      rewardCardId?: string;
      rewardExternalDescription?: string;
      timePerQuestion?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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
          max_players: maxPlayers,
          class_id: classId || null,
          created_by: user.id,
          reward_type: rewardType,
          reward_coins_1st: rewardCoins1st || 100,
          reward_coins_2nd: rewardCoins2nd || 50,
          reward_coins_3rd: rewardCoins3rd || 25,
          reward_card_id: rewardCardId || null,
          reward_external_description: rewardExternalDescription || null,
          time_per_question_seconds: timePerQuestion || 30
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

// Hook para entrar na sala por código
export function useJoinRoomByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomCode }: { roomCode: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar sala pelo código
      const { data: room, error: roomError } = await supabase
        .from('quiz_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (roomError || !room) {
        throw new Error('Sala não encontrada ou já iniciada');
      }

      // Verificar se já está na sala
      const { data: existingPlayer } = await supabase
        .from('quiz_room_players')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        return room;
      }

      // Entrar na sala
      const { error: joinError } = await supabase
        .from('quiz_room_players')
        .insert({
          room_id: room.id,
          user_id: user.id
        });

      if (joinError) throw joinError;
      return room;
    },
    onSuccess: (room) => {
      // Invalidar com o roomId específico
      queryClient.invalidateQueries({ queryKey: ['room-players', room.id] });
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
      toast.success('Você entrou na sala!');
    },
    onError: (error: any) => {
      console.error('Erro ao entrar na sala:', error);
      toast.error(error.message || 'Erro ao entrar na sala');
    }
  });
}

// Hook para entrar na sala (já existente)
export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      // Verificar se já está na sala
      const { data: existingPlayer } = await supabase
        .from('quiz_room_players')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      if (existingPlayer) {
        return existingPlayer;
      }

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
    },
    onError: (error: any) => {
      console.error('Erro ao entrar na sala:', error);
    }
  });
}

// Hook para iniciar quiz (só o criador)
export function useStartRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          current_question_index: 0,
          question_started_at: new Date().toISOString()
        } as any)
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

// Hook para avançar para próxima questão (só professor)
export function useNextQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, questionIndex }: { roomId: string; questionIndex: number }) => {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .update({
          current_question_index: questionIndex,
          question_started_at: new Date().toISOString()
        } as any)
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-room'] });
    }
  });
}

// Hook para finalizar sala
export function useFinishRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString()
        } as any)
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-room'] });
      queryClient.invalidateQueries({ queryKey: ['active-quiz-rooms'] });
    }
  });
}

// Hook para atualizar score do jogador
export function useUpdatePlayerScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      playerId, 
      score,
      correctAnswers,
      currentQuestionIndex
    }: { 
      playerId: string; 
      score: number;
      correctAnswers: number;
      currentQuestionIndex: number;
    }) => {
      const { data, error } = await supabase
        .from('quiz_room_players')
        .update({
          score,
          correct_answers: correctAnswers,
          current_question_index: currentQuestionIndex
        } as any)
        .eq('id', playerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
    }
  });
}

// Hook para atualizar posição (deprecated - usar useUpdatePlayerScore)
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
          attempt_id: attemptId,
          finished_at: new Date().toISOString()
        } as any)
        .eq('id', playerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
    }
  });
}

// Hook para distribuir prêmios
export function useDistributeRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId }: { roomId: string }) => {
      // Buscar sala e jogadores
      const { data: room, error: roomError } = await supabase
        .from('quiz_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !room) throw new Error('Sala não encontrada');

      const typedRoom = room as unknown as QuizRoom;

      if (typedRoom.rewards_distributed) {
        throw new Error('Prêmios já foram distribuídos');
      }

      const { data: players, error: playersError } = await supabase
        .from('quiz_room_players')
        .select('*, profiles(name)')
        .eq('room_id', roomId)
        .order('score', { ascending: false });

      if (playersError) throw playersError;

      const sortedPlayers = players as unknown as RoomPlayer[];

      // Distribuir recompensas baseado no tipo
      if (typedRoom.reward_type === 'coins') {
        const rewards = [
          { position: 1, coins: typedRoom.reward_coins_1st },
          { position: 2, coins: typedRoom.reward_coins_2nd },
          { position: 3, coins: typedRoom.reward_coins_3rd }
        ];

        for (let i = 0; i < Math.min(3, sortedPlayers.length); i++) {
          const player = sortedPlayers[i];
          const reward = rewards[i];
          
          if (reward.coins > 0) {
            await supabase.rpc('update_user_coins', {
              user_id: player.user_id,
              amount: reward.coins
            });
          }
        }
      } else if (typedRoom.reward_type === 'card' && typedRoom.reward_card_id && sortedPlayers.length > 0) {
        // Dar carta para o 1º lugar
        const winner = sortedPlayers[0];
        await supabase
          .from('user_cards')
          .insert({
            user_id: winner.user_id,
            card_id: typedRoom.reward_card_id
          });
      }

      // Atualizar posições dos jogadores
      for (let i = 0; i < sortedPlayers.length; i++) {
        await supabase
          .from('quiz_room_players')
          .update({ position: i + 1 } as any)
          .eq('id', sortedPlayers[i].id);
      }

      // Salvar histórico da partida
      const playersRanking = sortedPlayers.map((p, i) => ({
        user_id: p.user_id,
        name: p.profiles?.name,
        position: i + 1,
        score: p.score,
        correct_answers: p.correct_answers
      }));

      await (supabase as any)
        .from('multiplayer_match_history')
        .insert({
          room_id: roomId,
          quiz_id: typedRoom.quiz_id,
          winner_id: sortedPlayers.length > 0 ? sortedPlayers[0].user_id : null,
          total_players: sortedPlayers.length,
          started_at: typedRoom.started_at,
          finished_at: new Date().toISOString(),
          reward_type: typedRoom.reward_type,
          reward_description: typedRoom.reward_type === 'coins' 
            ? `1º: ${typedRoom.reward_coins_1st}, 2º: ${typedRoom.reward_coins_2nd}, 3º: ${typedRoom.reward_coins_3rd} moedas`
            : typedRoom.reward_type === 'card'
            ? 'Carta exclusiva para o 1º lugar'
            : typedRoom.reward_external_description || 'Prêmio externo',
          players_ranking: playersRanking,
          match_data: { questions_count: typedRoom.current_question_index + 1 }
        });

      // Marcar prêmios como distribuídos
      await supabase
        .from('quiz_rooms')
        .update({ rewards_distributed: true } as any)
        .eq('id', roomId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-room'] });
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
      toast.success('Prêmios distribuídos com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao distribuir prêmios:', error);
      toast.error(error.message || 'Erro ao distribuir prêmios');
    }
  });
}

// Hook para deletar sala (só criador)
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      // Primeiro deletar jogadores da sala
      await supabase
        .from('quiz_room_players')
        .delete()
        .eq('room_id', roomId);

      // Depois deletar a sala
      const { error } = await supabase
        .from('quiz_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-quiz-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-room'] });
      toast.success('Sala excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar sala:', error);
      toast.error('Erro ao deletar sala');
    }
  });
}

// Hook para sair da sala
export function useLeaveRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { error } = await supabase
        .from('quiz_room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-players'] });
      queryClient.invalidateQueries({ queryKey: ['active-quiz-rooms'] });
    }
  });
}