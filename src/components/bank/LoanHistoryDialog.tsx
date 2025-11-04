import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTransactions } from '@/hooks/bank/useTransactions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface LoanHistoryDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoanHistoryDialog({ studentId, studentName, open, onOpenChange }: LoanHistoryDialogProps) {
  const { data: transactions, isLoading } = useTransactions();

  const studentTransactions = transactions?.filter(
    t => t.sender_id === studentId || t.receiver_id === studentId
  ) || [];

  const loanTransactions = studentTransactions.filter(
    t => t.type === 'loan_granted' || t.type === 'loan_payment' || t.type === 'loan_forgiven'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico Financeiro - {studentName}</DialogTitle>
          <DialogDescription>
            Histórico completo de empréstimos e transações do aluno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 mb-1">Total Recebido</p>
              <p className="text-2xl font-bold text-green-900">
                {studentTransactions
                  .filter(t => t.receiver_id === studentId)
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('pt-BR')} IFC
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 mb-1">Total Enviado</p>
              <p className="text-2xl font-bold text-red-900">
                {studentTransactions
                  .filter(t => t.sender_id === studentId)
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('pt-BR')} IFC
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Histórico de Empréstimos</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : loanTransactions.length > 0 ? (
              <div className="space-y-2">
                {loanTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'loan_granted' ? 'bg-blue-100' :
                          transaction.type === 'loan_forgiven' ? 'bg-green-100' :
                          'bg-orange-100'
                        }`}>
                          {transaction.receiver_id === studentId ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.receiver_id === studentId ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.receiver_id === studentId ? '+' : '-'}
                          {transaction.amount.toLocaleString('pt-BR')} IFC
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type === 'loan_granted' ? 'Empréstimo' :
                           transaction.type === 'loan_forgiven' ? 'Perdoado' :
                           'Pagamento'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum histórico de empréstimos encontrado
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Todas as Transações</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : studentTransactions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {studentTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-2 border rounded text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-xs">{transaction.description}</span>
                      </div>
                      <span className={`font-medium ${
                        transaction.receiver_id === studentId ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.receiver_id === studentId ? '+' : '-'}
                        {transaction.amount} IFC
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma transação encontrada
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
