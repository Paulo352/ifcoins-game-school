import { useAuth } from '@/contexts/AuthContext';
import { BankDashboard } from '@/components/bank/BankDashboard';
import { LoanManagement } from '@/components/bank/LoanManagement';
import { LoanRequest } from '@/components/bank/LoanRequest';
import { LoanManagementPanel } from '@/components/admin/LoanManagementPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BankSection() {
  const { profile } = useAuth();

  if (!profile) return null;

  // Admin vê dashboard completo
  if (profile.role === 'admin') {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="management" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="management">Gestão de Empréstimos</TabsTrigger>
            <TabsTrigger value="approval">Aprovar Solicitações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="management" className="space-y-6 mt-6">
            <LoanManagementPanel />
          </TabsContent>
          
          <TabsContent value="approval" className="space-y-6 mt-6">
            <BankDashboard />
            <LoanManagement />
          </TabsContent>
        </Tabs>
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
