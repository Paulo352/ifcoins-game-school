
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Event } from '@/types/supabase';

interface EventData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  bonus_multiplier: number;
  bonus_coins?: number;
}

export function useEventManagement() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
  });

  const createEvent = async (eventData: EventData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_event', {
        name: eventData.name,
        description: eventData.description || null,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        bonus_multiplier: eventData.bonus_multiplier
      });

      if (error) throw error;

      // Se o evento tem bonus de moedas, atualizar a tabela separadamente
      if (eventData.bonus_coins && eventData.bonus_coins > 0 && data) {
        const { error: updateError } = await supabase
          .from('events')
          .update({ bonus_coins: eventData.bonus_coins })
          .eq('id', data);

        if (updateError) throw updateError;
      }

      toast({
        title: "Evento criado!",
        description: "O evento foi criado com sucesso.",
      });
      refetch();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, eventData: EventData) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_event', {
        event_id: eventId,
        name: eventData.name,
        description: eventData.description || null,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        bonus_multiplier: eventData.bonus_multiplier
      });

      if (error) throw error;

      // Atualizar bonus de moedas separadamente
      const { error: updateError } = await supabase
        .from('events')
        .update({ bonus_coins: eventData.bonus_coins || 0 })
        .eq('id', eventId);

      if (updateError) throw updateError;

      toast({
        title: "Evento atualizado!",
        description: "O evento foi atualizado com sucesso.",
      });
      refetch();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deactivateEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('update_event', {
        event_id: eventId,
        name: events?.find(e => e.id === eventId)?.name || '',
        description: events?.find(e => e.id === eventId)?.description || '',
        start_date: events?.find(e => e.id === eventId)?.start_date || today,
        end_date: today,
        bonus_multiplier: events?.find(e => e.id === eventId)?.bonus_multiplier || 1
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento desativado com sucesso!",
      });

      refetch();
      return true;
    } catch (error) {
      console.error('Erro ao desativar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o evento",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('delete_event', {
        event_id: eventId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento removido com sucesso!",
      });

      refetch();
      return true;
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o evento",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para dar moedas de bonus do evento para todos os usuários
  const giveEventBonus = async (eventId: string) => {
    setLoading(true);
    try {
      // Buscar dados do evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('name, bonus_coins')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (!event.bonus_coins || event.bonus_coins <= 0) {
        toast({
          title: "Erro",
          description: "Este evento não possui bonus de moedas configurado.",
          variant: "destructive",
        });
        return;
      }

      // Buscar todos os usuários estudantes
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, email, coins')
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum estudante encontrado para receber o bonus.",
        });
        return;
      }

      // Dar moedas para todos os estudantes
      let updatedCount = 0;
      for (const student of students) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            coins: student.coins + event.bonus_coins,
            updated_at: new Date().toISOString()
          })
          .eq('id', student.id);

        if (!updateError) {
          updatedCount++;
        }
      }

      toast({
        title: "Bonus distribuído!",
        description: `${event.bonus_coins} moedas foram dadas para ${updatedCount} estudantes do evento "${event.name}".`,
      });
    } catch (error: any) {
      console.error('Erro ao dar bonus do evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível distribuir o bonus do evento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { 
    events, 
    isLoading, 
    loading, 
    createEvent, 
    updateEvent, 
    deactivateEvent, 
    deleteEvent, 
    giveEventBonus, 
    refetch 
  };
}
