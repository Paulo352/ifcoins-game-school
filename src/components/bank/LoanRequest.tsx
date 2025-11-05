import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMyLoans, useRequestLoan, useAcceptCounterProposal, useRejectCounterProposal } from '@/hooks/bank/useLoans';
import { DollarSign, Clock, CheckCircle, XCircle, Calculator } from 'lucide-react';
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
  const [installments, setInstallments] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'automatic'>('manual');

  const { data: loans, isLoading } = useMyLoans();
  const requestLoan = useRequestLoan();
  const acceptCounter = useAcceptCounterProposal();
  const rejectCounter = useRejectCounterProposal();

  const interestRate = installments * 2;
  const totalWithInterest = parseInt(amount || '0') * (1 + interestRate / 100);
  const installmentValue = totalWithInterest / installments;

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
    
    requestLoan.mutate({ amount: amountNum, reason, installments, paymentMethod });
    setAmount('');
    setReason('');
    setInstallments(1);
    setPaymentMethod('manual');
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
              Simule e solicite seu empréstimo
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

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas Desejadas (1-10 semanas)</Label>
              <Input
                id="installments"
                type="number"
                min={1}
                max={10}
                value={installments}
                onChange={(e) => setInstallments(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ O admin pode ajustar ao aprovar. Taxa: 2% por parcela
              </p>
            </div>

            <div className="space-y-2">
              <Label>Método de Pagamento Preferido</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'manual' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('manual')}
                  className="flex-1"
                >
                  Manual
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'automatic' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('automatic')}
                  className="flex-1"
                >
                  Automático
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentMethod === 'manual' 
                  ? '💡 Você decide quando pagar (taxa adicional se atrasar)'
                  : '💡 Desconto semanal automático do seu saldo'
                }
              </p>
            </div>

            {parseInt(amount) > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Valor Solicitado:
                  </span>
                  <span className="font-bold">{amount} IFC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Juros ({interestRate}%):</span>
                  <span className="text-yellow-600 font-bold">
                    +{(totalWithInterest - parseInt(amount)).toFixed(0)} IFC
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-bold">Total a Pagar:</span>
                  <span className="font-bold text-lg">{totalWithInterest.toFixed(0)} IFC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Parcela Semanal:</span>
                  <span className="font-bold text-primary">
                    {installmentValue.toFixed(0)} IFC/semana
                  </span>
                </div>
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
              💡 O administrador analisará seu perfil antes de aprovar
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
                      
                      {loan.counter_status === 'pending' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-yellow-900">
                            🔔 Você recebeu uma contraproposta!
                          </p>
                          <div className="space-y-1 text-xs text-yellow-800">
                            <div className="flex justify-between">
                              <span>Parcelas:</span>
                              <span className="font-medium">{loan.counter_installments} semanas</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Método:</span>
                              <span className="font-medium">
                                {loan.counter_payment_method === 'automatic' ? 'Desconto automático' : 'Pagamento manual'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa:</span>
                              <span className="font-medium text-yellow-600">{(loan.counter_installments || 0) * 2}%</span>
                            </div>
                            <div className="flex justify-between border-t pt-1">
                              <span className="font-bold">Total c/ juros:</span>
                              <span className="font-bold">{(loan.amount * (1 + ((loan.counter_installments || 0) * 2) / 100)).toFixed(0)} IFC</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => acceptCounter.mutate(loan.id)}
                              disabled={acceptCounter.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectCounter.mutate(loan.id)}
                              disabled={rejectCounter.isPending}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      )}

                      {loan.status === 'approved' && loan.installments && loan.counter_status !== 'pending' && (
                        <div className="text-xs space-y-1 p-2 bg-muted rounded">
                          <div className="flex justify-between">
                            <span>Parcelas:</span>
                            <span className="font-medium">{loan.installments_paid}/{loan.installments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total c/ Juros:</span>
                            <span className="font-bold">{loan.total_with_interest?.toFixed(0)} IFC</span>
                          </div>
                          {loan.debt_forgiven && (
                            <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 w-full justify-center">
                              Dívida Perdoada
                            </Badge>
                          )}
                        </div>
                      )}
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
