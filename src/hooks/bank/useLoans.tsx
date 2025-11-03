import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Loan {
  id: string;
  student_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'repaid';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  student?: { name: string; email: string };
  reviewer?: { name: string; email: string };
}

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          student:profiles!loans_student_id_fkey(name, email),
          reviewer:profiles!loans_reviewed_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Loan[];
    }
  });
}

export function useMyLoans() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-loans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          reviewer:profiles!loans_reviewed_by_fkey(name, email)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!user
  });
}

export function useRequestLoan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('loans')
        .insert({
          student_id: user.id,
          amount,
          reason
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Empréstimo solicitado!',
        description: 'Aguarde a análise do administrador.'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível solicitar o empréstimo.',
        variant: 'destructive'
      });
    }
  });
}

export function useApproveLoan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ loanId }: { loanId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('process_loan_approval', {
        loan_id: loanId,
        admin_id: user.id
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['bank'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Empréstimo aprovado!',
        description: 'As moedas foram transferidas para o aluno.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível aprovar o empréstimo.',
        variant: 'destructive'
      });
    }
  });
}

export function useDenyLoan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ loanId }: { loanId: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('loans')
        .update({
          status: 'denied',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', loanId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Empréstimo negado',
        description: 'O aluno foi notificado.'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível negar o empréstimo.',
        variant: 'destructive'
      });
    }
  });
}
