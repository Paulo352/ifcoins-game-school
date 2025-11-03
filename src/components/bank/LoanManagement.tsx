import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLoans, useApproveLoan, useDenyLoan } from '@/hooks/bank/useLoans';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  denied: 'Negado',
  repaid: 'Pago'
};

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  denied: 'bg-red-500',
  repaid: 'bg-blue-500'
};

export function LoanManagement() {
  const { data: loans, isLoading } = useLoans();
  const approveLoan = useApproveLoan();
  const denyLoan = useDenyLoan();

  const pendingLoans = loans?.filter(l => l.status === 'pending') || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Empréstimos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Empréstimos</CardTitle>
        <CardDescription>
          {pendingLoans.length} empréstimos aguardando análise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans && loans.length > 0 ? (
            loans.map((loan) => (
              <div key={loan.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{loan.student?.name}</span>
                      <Badge className={statusColors[loan.status]}>
                        {statusLabels[loan.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{loan.student?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ifpr-green">
                      {loan.amount.toLocaleString('pt-BR')} IFC
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(loan.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded">
                  <p className="text-sm"><strong>Motivo:</strong> {loan.reason}</p>
                </div>

                {loan.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => approveLoan.mutate({ loanId: loan.id })}
                      disabled={approveLoan.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => denyLoan.mutate({ loanId: loan.id })}
                      disabled={denyLoan.isPending}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Negar
                    </Button>
                  </div>
                )}

                {loan.status !== 'pending' && loan.reviewed_by && (
                  <p className="text-xs text-muted-foreground">
                    Revisado por {loan.reviewer?.name} em{' '}
                    {loan.reviewed_at && new Date(loan.reviewed_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum empréstimo solicitado ainda</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
