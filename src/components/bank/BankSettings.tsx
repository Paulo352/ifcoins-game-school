import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateBank, BankData } from '@/hooks/bank/useBank';
import { Settings } from 'lucide-react';

interface BankSettingsProps {
  bank: BankData | undefined;
}

export function BankSettings({ bank }: BankSettingsProps) {
  const [totalCoins, setTotalCoins] = useState(bank?.total_coins || 10000);
  const updateBank = useUpdateBank();

  const handleUpdate = () => {
    if (totalCoins < (bank?.coins_in_circulation || 0)) {
      alert('O total de moedas não pode ser menor que as moedas em circulação!');
      return;
    }
    updateBank.mutate({ totalCoins });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Banco
        </CardTitle>
        <CardDescription>
          Ajuste o saldo total do IFBank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="total-coins">Total de Moedas no Banco</Label>
          <Input
            id="total-coins"
            type="number"
            value={totalCoins}
            onChange={(e) => setTotalCoins(parseInt(e.target.value) || 0)}
            min={(bank?.coins_in_circulation || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Mínimo: {bank?.coins_in_circulation.toLocaleString('pt-BR')} IFCoins (em circulação)
          </p>
        </div>

        <Button 
          onClick={handleUpdate}
          disabled={updateBank.isPending || totalCoins === bank?.total_coins}
          className="w-full"
        >
          {updateBank.isPending ? 'Atualizando...' : 'Atualizar Banco'}
        </Button>
      </CardContent>
    </Card>
  );
}
