import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoans, useForgiveDebt } from '@/hooks/bank/useLoans';
import { useTransactions } from '@/hooks/bank/useTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  History,
  TrendingUp,
  Users
} from 'lucide-react';
import { LoanHistoryDialog } from '@/components/bank/LoanHistoryDialog';

export function LoanManagementPanel() {
  const { user } = useAuth();
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const forgiveDebt = useForgiveDebt();
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleForgiveDebt = (loanId: string) => {
    if (!user) return;
    if (!confirm('Tem certeza que deseja perdoar esta dívida?')) return;
    
    forgiveDebt.mutate({ loanId, adminId: user.id });
  };

  const openHistory = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setHistoryOpen(true);
  };

  // Estatísticas
  const stats = {
    totalLoans: loans?.length || 0,
    pending: loans?.filter(l => l.status === 'pending').length || 0,
    approved: loans?.filter(l => l.status === 'approved' && !l.debt_forgiven).length || 0,
    overdue: loans?.filter(l => l.is_overdue && !l.debt_forgiven).length || 0,
    forgiven: loans?.filter(l => l.debt_forgiven).length || 0,
    totalLent: loans?.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.amount, 0) || 0,
    totalToReceive: loans?.filter(l => l.status === 'approved' && !l.debt_forgiven)
      .reduce((sum, l) => sum + (l.total_with_interest - (l.installments_paid * (l.total_with_interest / l.installments))), 0) || 0
  };

  // Transações relacionadas a empréstimos
  const loanTransactions = transactions?.filter(t => 
    t.type === 'loan_granted' || 
    t.type === 'loan_payment' || 
    t.type === 'loan_forgiven'
  ) || [];

  if (loansLoading || transactionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Empréstimos</h2>
        <p className="text-muted-foreground">
          Painel completo de controle de empréstimos e dívidas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emprestado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLent.toLocaleString('pt-BR')} IFC</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved} empréstimos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToReceive.toFixed(0)} IFC</div>
            <p className="text-xs text-muted-foreground">
              Com juros inclusos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Empréstimos Ativos</TabsTrigger>
          <TabsTrigger value="overdue">Em Atraso</TabsTrigger>
          <TabsTrigger value="history">Histórico Completo</TabsTrigger>
        </TabsList>

        {/* Empréstimos Ativos */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empréstimos Aprovados</CardTitle>
              <CardDescription>
                Acompanhe os pagamentos em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loans?.filter(l => l.status === 'approved' && !l.debt_forgiven).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum empréstimo ativo no momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loans?.filter(l => l.status === 'approved' && !l.debt_forgiven).map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{loan.student?.name}</p>
                          <p className="text-sm text-muted-foreground">{loan.reason}</p>
                        </div>
                        <Badge variant={loan.is_overdue ? 'destructive' : 'default'}>
                          {loan.is_overdue ? 'Atrasado' : 'Em dia'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor Original:</span>
                          <p className="font-medium">{loan.amount} IFC</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total c/ Juros:</span>
                          <p className="font-medium">{loan.total_with_interest?.toFixed(0)} IFC</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Parcelas:</span>
                          <p className="font-medium">{loan.installments_paid}/{loan.installments}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Método:</span>
                          <p className="font-medium">
                            {loan.payment_method === 'automatic' ? 'Automático' : 'Manual'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHistory(loan.student_id, loan.student?.name || '')}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Ver Histórico
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleForgiveDebt(loan.id)}
                          disabled={forgiveDebt.isPending}
                        >
                          Perdoar Dívida
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Em Atraso */}
        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Empréstimos em Atraso
              </CardTitle>
              <CardDescription>
                Dívidas que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loans?.filter(l => l.is_overdue && !l.debt_forgiven).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
                  <p>Nenhum empréstimo em atraso! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loans?.filter(l => l.is_overdue && !l.debt_forgiven).map((loan) => (
                    <div key={loan.id} className="border-2 border-destructive rounded-lg p-4 space-y-3 bg-destructive/5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{loan.student?.name}</p>
                          <p className="text-sm text-muted-foreground">{loan.reason}</p>
                          <Badge variant="destructive" className="mt-1">
                            Atraso: {Math.floor((new Date().getTime() - new Date(loan.next_payment_date || '').getTime()) / (1000 * 60 * 60 * 24))} dias
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Faltam pagar:</span>
                          <p className="font-bold text-destructive">
                            {(loan.total_with_interest - (loan.installments_paid * (loan.total_with_interest / loan.installments))).toFixed(0)} IFC
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Parcelas pagas:</span>
                          <p className="font-medium">{loan.installments_paid}/{loan.installments}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHistory(loan.student_id, loan.student?.name || '')}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Ver Histórico
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleForgiveDebt(loan.id)}
                          disabled={forgiveDebt.isPending}
                        >
                          Perdoar Dívida
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico Completo */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as transações relacionadas a empréstimos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loanTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transação registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {loanTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'loan_granted' && <DollarSign className="h-5 w-5 text-blue-500" />}
                        {transaction.type === 'loan_payment' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {transaction.type === 'loan_forgiven' && <XCircle className="h-5 w-5 text-yellow-500" />}
                        <div>
                          <p className="font-medium text-sm">
                            {transaction.type === 'loan_granted' && 'Empréstimo Concedido'}
                            {transaction.type === 'loan_payment' && 'Pagamento de Parcela'}
                            {transaction.type === 'loan_forgiven' && 'Dívida Perdoada'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.receiver?.name || transaction.sender?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'loan_granted' ? 'text-blue-500' :
                          transaction.type === 'loan_payment' ? 'text-green-500' :
                          'text-yellow-500'
                        }`}>
                          {transaction.amount.toLocaleString('pt-BR')} IFC
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Histórico do Aluno */}
      {selectedStudent && (
        <LoanHistoryDialog
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}
    </div>
  );
}