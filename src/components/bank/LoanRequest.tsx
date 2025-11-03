import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMyLoans, useRequestLoan } from '@/hooks/bank/useLoans';
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const statusLabels = {
  pending: 'Aguardando',
  approved: 'Aprovado',
  denied: 'Negado',
  repaid: 'Pago'
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  denied: XCircle,
  repaid: CheckCircle
};

const statusColors = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  denied: 'bg-red-500',
  repaid: 'bg-blue-500'
};

export function LoanRequest() {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const { data: loans, isLoading } = useMyLoans();
  const requestLoan = useRequestLoan();

  const handleRequest = () => {
    const amountNum = parseInt(amount);
    
    if (!amountNum || amountNum <= 0) {
      alert('Digite um valor válido');
      return;
    }

    if (!reason.trim()) {
      alert('Informe o motivo do empréstimo');
      return;
    }

    if (!password) {
      setShowPassword(true);
      return;
    }

    // TODO: Validar senha (implementar sistema de confirmação)
    
    requestLoan.mutate({ amount: amountNum, reason });
    setAmount('');
    setReason('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Empréstimos IFBank</h2>
        <p className="text-muted-foreground">
          Solicite empréstimos e acompanhe suas solicitações
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Solicitar Empréstimo
            </CardTitle>
            <CardDescription>
              Informe o valor e o motivo da solicitação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (IFCoins)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 1000"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique por que precisa do empréstimo..."
                rows={4}
              />
            </div>

            {showPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Confirme sua senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                />
              </div>
            )}

            <Button 
              onClick={handleRequest}
              disabled={requestLoan.isPending}
              className="w-full"
            >
              {requestLoan.isPending ? 'Enviando...' : 'Solicitar Empréstimo'}
            </Button>

            <p className="text-xs text-muted-foreground">
              ⚠️ O administrador analisará seu perfil e histórico antes de aprovar.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minhas Solicitações</CardTitle>
            <CardDescription>
              Acompanhe o status dos seus empréstimos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : loans && loans.length > 0 ? (
              <div className="space-y-3">
                {loans.map((loan) => {
                  const StatusIcon = statusIcons[loan.status];
                  return (
                    <div key={loan.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={statusColors[loan.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[loan.status]}
                        </Badge>
                        <span className="font-bold text-ifpr-green">
                          {loan.amount.toLocaleString('pt-BR')} IFC
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{loan.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Solicitado em {new Date(loan.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {loan.status === 'denied' && (
                        <p className="text-xs text-red-500">
                          Empréstimo negado pelo administrador
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Você ainda não solicitou nenhum empréstimo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
