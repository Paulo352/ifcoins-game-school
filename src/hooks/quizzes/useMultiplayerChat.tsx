import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useRoomChat(roomId: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['room-chat', roomId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quiz_room_chat')
        .select('*, profiles(name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!roomId
  });
  
  useEffect(() => {
    if (!roomId) return;
    
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_room_chat',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['room-chat', roomId] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
  
  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, message }: { roomId: string; message: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('quiz_room_chat')
        .insert([{ room_id: roomId, user_id: userData.user?.id, message }]);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-chat', variables.roomId] });
    }
  });
}
