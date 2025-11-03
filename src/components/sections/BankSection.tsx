import { useAuth } from '@/contexts/AuthContext';
import { BankDashboard } from '@/components/bank/BankDashboard';
import { LoanManagement } from '@/components/bank/LoanManagement';
import { LoanRequest } from '@/components/bank/LoanRequest';

export function BankSection() {
  const { profile } = useAuth();

  if (!profile) return null;

  // Admin vê dashboard completo
  if (profile.role === 'admin') {
    return (
      <div className="space-y-6">
        <BankDashboard />
        <LoanManagement />
      </div>
    );
  }

  // Alunos veem solicitação de empréstimos
  if (profile.role === 'student') {
    return <LoanRequest />;
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>Você não tem acesso a esta seção.</p>
    </div>
  );
}
