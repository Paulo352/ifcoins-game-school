import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  event_id: string | null;
  created_by: string;
  is_active: boolean;
  allow_multiple_votes: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface PollWithOptions extends Poll {
  poll_options: PollOption[];
}

export interface CreatePollData {
  title: string;
  description?: string;
  event_id?: string;
  allow_multiple_votes: boolean;
  end_date: string;
  options: string[];
}

// Hook para buscar todas as votações ativas
export function useActivePolls() {
  return useQuery({
    queryKey: ['active-polls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PollWithOptions[];
    },
  });
}

// Hook para buscar todas as votações (admin)
export function useAllPolls() {
  return useQuery({
    queryKey: ['all-polls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PollWithOptions[];
    },
  });
}

// Hook para buscar votos do usuário
export function useUserVotes(pollId?: string) {
  return useQuery({
    queryKey: ['user-votes', pollId],
    queryFn: async () => {
      const query = supabase
        .from('poll_votes')
        .select('*');
      
      if (pollId) {
        query.eq('poll_id', pollId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PollVote[];
    },
    enabled: !!pollId,
  });
}

// Hook para criar votação
export function useCreatePoll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pollData: CreatePollData) => {
      const { data, error } = await supabase.rpc('create_poll_with_options', {
        poll_title: pollData.title,
        poll_description: pollData.description || null,
        poll_event_id: pollData.event_id || null,
        allow_multiple: pollData.allow_multiple_votes,
        end_date: pollData.end_date,
        options: pollData.options,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-polls'] });
      queryClient.invalidateQueries({ queryKey: ['all-polls'] });
      toast({
        title: "Sucesso",
        description: "Votação criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar votação",
        variant: "destructive",
      });
    },
  });
}

// Hook para votar
export function useVoteInPoll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ pollId, optionIds }: { pollId: string; optionIds: string[] }) => {
      const { data, error } = await supabase.rpc('vote_in_poll', {
        poll_id: pollId,
        option_ids: optionIds,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-votes', variables.pollId] });
      queryClient.invalidateQueries({ queryKey: ['active-polls'] });
      toast({
        title: "Sucesso",
        description: "Voto registrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao votar",
        variant: "destructive",
      });
    },
  });
}

// Hook para desativar votação (admin)
export function useDeactivatePoll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pollId: string) => {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: false })
        .eq('id', pollId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-polls'] });
      queryClient.invalidateQueries({ queryKey: ['all-polls'] });
      toast({
        title: "Sucesso",
        description: "Votação desativada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar votação",
        variant: "destructive",
      });
    },
  });
}