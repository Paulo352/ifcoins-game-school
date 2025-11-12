import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  mentor_notes: string | null;
  mentee_feedback: string | null;
  mentor?: { name: string; email: string };
  mentee?: { name: string; email: string };
}

export interface MentorshipActivity {
  id: string;
  mentorship_id: string;
  activity_type: 'session' | 'help' | 'quiz_support' | 'study_session';
  description: string;
  coins_earned: number;
  created_at: string;
}

export function useMentorships() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['mentorships', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('mentorships')
        .select(`
          *,
          mentor:profiles!mentorships_mentor_id_fkey(name, email),
          mentee:profiles!mentorships_mentee_id_fkey(name, email)
        `)
        .or(`mentor_id.eq.${profile.id},mentee_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Mentorship[];
    },
    enabled: !!profile,
  });
}

export function useAvailableMentors() {
  return useQuery({
    queryKey: ['available-mentors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, coins')
        .eq('role', 'student')
        .gte('coins', 1000)
        .order('coins', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}

export function useRequestMentorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mentorId }: { mentorId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('mentorships')
        .insert({
          mentor_id: mentorId,
          mentee_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
      toast.success('Solicitação de mentoria enviada!');
    },
    onError: (error: any) => {
      console.error('Erro ao solicitar mentoria:', error);
      toast.error(error.message || 'Erro ao solicitar mentoria');
    },
  });
}

export function useUpdateMentorshipStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mentorshipId, status }: { mentorshipId: string; status: string }) => {
      const updates: any = { status };
      
      if (status === 'active') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('mentorships')
        .update(updates)
        .eq('id', mentorshipId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
      toast.success('Status da mentoria atualizado!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar mentoria:', error);
      toast.error('Erro ao atualizar mentoria');
    },
  });
}

export function useMentorshipActivities(mentorshipId: string) {
  return useQuery({
    queryKey: ['mentorship-activities', mentorshipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentorship_activities')
        .select('*')
        .eq('mentorship_id', mentorshipId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MentorshipActivity[];
    },
    enabled: !!mentorshipId,
  });
}

export function useCreateMentorshipActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: {
      mentorshipId: string;
      activityType: string;
      description: string;
      coinsEarned: number;
    }) => {
      const { data, error } = await supabase
        .from('mentorship_activities')
        .insert({
          mentorship_id: activity.mentorshipId,
          activity_type: activity.activityType,
          description: activity.description,
          coins_earned: activity.coinsEarned,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-activities', variables.mentorshipId] });
      queryClient.invalidateQueries({ queryKey: ['mentorships'] });
      toast.success('Atividade registrada e moedas creditadas!');
    },
    onError: (error: any) => {
      console.error('Erro ao registrar atividade:', error);
      toast.error('Erro ao registrar atividade');
    },
  });
}
