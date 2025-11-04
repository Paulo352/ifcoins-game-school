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
  installments: number;
  interest_rate: number;
  total_with_interest: number;
  payment_method: 'manual' | 'automatic';
  installments_paid: number;
  next_payment_date: string | null;
  is_overdue: boolean;
  counter_installments: number | null;
  counter_payment_method: string | null;
  counter_status: 'none' | 'pending' | 'accepted' | 'rejected';
  debt_forgiven: boolean;
  forgiven_by: string | null;
  forgiven_at: string | null;
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

  return useMutation({
    mutationFn: async ({ 
      loanId, 
      adminId, 
      installments = 1, 
      paymentMethod = 'manual' 
    }: { 
      loanId: string; 
      adminId: string; 
      installments?: number;
      paymentMethod?: 'manual' | 'automatic';
    }) => {
      const { data, error } = await supabase.rpc('process_loan_approval', {
        loan_id: loanId,
        admin_id: adminId,
        installments,
        payment_method: paymentMethod
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
    mutationFn: async ({ loanId, adminId }: { loanId: string; adminId: string }) => {
      const { error } = await supabase
        .from('loans')
        .update({
          status: 'denied',
          reviewed_by: adminId,
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

export function useForgiveDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loanId, adminId }: { loanId: string; adminId: string }) => {
      const { data, error } = await supabase.rpc('forgive_loan_debt', {
        loan_id: loanId,
        admin_id: adminId
      });
      
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Dívida perdoada',
        description: 'A dívida do aluno foi perdoada com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível perdoar a dívida.',
        variant: 'destructive'
      });
    }
  });
}

export function useCounterProposalLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      loanId, 
      counterInstallments, 
      counterPaymentMethod 
    }: { 
      loanId: string; 
      counterInstallments: number;
      counterPaymentMethod: 'manual' | 'automatic';
    }) => {
      const { error } = await supabase
        .from('loans')
        .update({
          counter_installments: counterInstallments,
          counter_payment_method: counterPaymentMethod,
          counter_status: 'pending'
        })
        .eq('id', loanId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Contraproposta enviada',
        description: 'O aluno receberá a contraproposta para análise.'
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a contraproposta.',
        variant: 'destructive'
      });
    }
  });
}

export function useAcceptCounterProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('accept_loan_counter_proposal', {
        loan_id: loanId,
        student_id: user.id
      });
      
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Contraproposta aceita',
        description: 'As novas condições foram aplicadas ao empréstimo.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível aceitar a contraproposta.',
        variant: 'destructive'
      });
    }
  });
}

export function useRejectCounterProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase.rpc('reject_loan_counter_proposal', {
        loan_id: loanId,
        student_id: user.id
      });
      
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Contraproposta rejeitada',
        description: 'Você rejeitou a contraproposta do administrador.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível rejeitar a contraproposta.',
        variant: 'destructive'
      });
    }
  });
}
