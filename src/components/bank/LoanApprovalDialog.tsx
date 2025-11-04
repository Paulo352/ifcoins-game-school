import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useApproveLoan, useCounterProposalLoan } from '@/hooks/bank/useLoans';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, Calendar, AlertCircle } from 'lucide-react';

interface LoanApprovalDialogProps {
  loan: {
    id: string;
    amount: number;
    reason: string;
    student?: { name: string };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoanApprovalDialog({ loan, open, onOpenChange }: LoanApprovalDialogProps) {
  const { user } = useAuth();
  const approveLoan = useApproveLoan();
  const counterProposal = useCounterProposalLoan();
  const [installments, setInstallments] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'automatic'>('manual');
  const [isCounterProposal, setIsCounterProposal] = useState(false);

  const interestRate = installments * 2;
  const totalWithInterest = loan.amount * (1 + interestRate / 100);
  const installmentValue = totalWithInterest / installments;

  const handleApprove = () => {
    if (!user) return;
    
    if (isCounterProposal) {
      counterProposal.mutate(
        {
          loanId: loan.id,
          counterInstallments: installments,
          counterPaymentMethod: paymentMethod
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setIsCounterProposal(false);
          }
        }
      );
    } else {
      approveLoan.mutate(
        {
          loanId: loan.id,
          adminId: user.id,
          installments,
          paymentMethod
        },
        {
          onSuccess: () => onOpenChange(false)
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isCounterProposal ? 'Enviar Contraproposta' : 'Aprovar Empréstimo'}</DialogTitle>
          <DialogDescription>
            {isCounterProposal 
              ? 'O aluno receberá sua contraproposta e poderá aceitar ou rejeitar'
              : `Configure as condições de pagamento para ${loan.student?.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isCounterProposal && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Informações do Aluno:</p>
                  <p>• Valor solicitado: <strong>{loan.amount} IFC</strong></p>
                  <p>• Motivo: {loan.reason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Número de Parcelas (1-10 semanas)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={installments}
              onChange={(e) => setInstallments(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            />
            <p className="text-sm text-muted-foreground">
              Taxa de juros: {interestRate}% (2% por parcela)
            </p>
          </div>

          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Valor Original:
              </span>
              <span className="font-bold">{loan.amount} IFC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Juros ({interestRate}%):</span>
              <span className="font-bold text-yellow-600">
                +{(totalWithInterest - loan.amount).toFixed(0)} IFC
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-bold">Total a Pagar:</span>
              <span className="font-bold text-lg">{totalWithInterest.toFixed(0)} IFC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Valor por Parcela:
              </span>
              <span className="font-bold text-primary">{installmentValue.toFixed(0)} IFC</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Método de Pagamento</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="font-normal cursor-pointer">
                  Manual - Aluno paga quando quiser
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="automatic" id="automatic" />
                <Label htmlFor="automatic" className="font-normal cursor-pointer">
                  Automático - Desconto semanal do saldo
                </Label>
              </div>
            </RadioGroup>
            
            {paymentMethod === 'manual' && (
              <p className="text-sm text-muted-foreground">
                ⚠️ Se atrasar após 1 semana, será cobrada taxa adicional de 5% sobre a parcela
              </p>
            )}
            {paymentMethod === 'automatic' && (
              <p className="text-sm text-muted-foreground">
                💡 O valor será descontado automaticamente toda semana
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            {!isCounterProposal && (
              <Button 
                variant="secondary" 
                onClick={() => setIsCounterProposal(true)} 
                className="flex-1"
              >
                Contraproposta
              </Button>
            )}
            <Button 
              onClick={handleApprove} 
              disabled={approveLoan.isPending || counterProposal.isPending} 
              className="flex-1"
            >
              {approveLoan.isPending || counterProposal.isPending 
                ? 'Processando...' 
                : isCounterProposal 
                  ? 'Enviar Contraproposta'
                  : 'Aprovar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
