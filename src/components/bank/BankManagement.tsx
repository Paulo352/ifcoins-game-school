import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBank, useUpdateBank, BankData } from '@/hooks/bank/useBank';
import { Building2, PlusCircle, MinusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function BankManagement() {
  const { data: bank } = useBank();
  const [addAmount, setAddAmount] = useState(0);
  const [removeAmount, setRemoveAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  const handleAddCoins = async () => {
    if (!bank || addAmount <= 0) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('bank')
        .update({ total_coins: bank.total_coins + addAmount })
        .eq('id', bank.id);

      if (error) throw error;

      toast({
        title: 'Moedas Adicionadas!',
        description: `${addAmount} IFCoins foram adicionados ao banco`,
      });
      setAddAmount(0);
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar moedas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCoins = async () => {
    if (!bank || removeAmount <= 0) return;
    
    const availableCoins = bank.total_coins - bank.coins_in_circulation;
    if (removeAmount > availableCoins) {
      toast({
        title: 'Erro',
        description: 'Não há moedas disponíveis suficientes para remover',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('bank')
        .update({ total_coins: bank.total_coins - removeAmount })
        .eq('id', bank.id);

      if (error) throw error;

      toast({
        title: 'Moedas Removidas!',
        description: `${removeAmount} IFCoins foram removidos do banco`,
      });
      setRemoveAmount(0);
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover moedas',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!bank) return <div>Carregando...</div>;

  const availableCoins = bank.total_coins - bank.coins_in_circulation;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestão do IFBank
          </CardTitle>
          <CardDescription>
            Controle as moedas do banco e disponibilidade para empréstimos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total no Banco</p>
              <p className="text-2xl font-bold text-blue-700">
                {bank.total_coins.toLocaleString('pt-BR')} IFC
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Em Circulação</p>
              <p className="text-2xl font-bold text-green-700">
                {bank.coins_in_circulation.toLocaleString('pt-BR')} IFC
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Disponível</p>
              <p className="text-2xl font-bold text-purple-700">
                {availableCoins.toLocaleString('pt-BR')} IFC
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="add-coins" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-green-600" />
                Adicionar Moedas ao Banco
              </Label>
              <Input
                id="add-coins"
                type="number"
                min="0"
                value={addAmount || ''}
                onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
                placeholder="Quantidade"
              />
              <Button
                onClick={handleAddCoins}
                disabled={processing || addAmount <= 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Adicionar Moedas
              </Button>
            </div>

            <div className="space-y-3">
              <Label htmlFor="remove-coins" className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-red-600" />
                Remover Moedas do Banco
              </Label>
              <Input
                id="remove-coins"
                type="number"
                min="0"
                max={availableCoins}
                value={removeAmount || ''}
                onChange={(e) => setRemoveAmount(parseInt(e.target.value) || 0)}
                placeholder="Quantidade"
              />
              <p className="text-xs text-muted-foreground">
                Máximo disponível: {availableCoins.toLocaleString('pt-BR')} IFC
              </p>
              <Button
                onClick={handleRemoveCoins}
                disabled={processing || removeAmount <= 0 || removeAmount > availableCoins}
                variant="destructive"
                className="w-full"
              >
                Remover Moedas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}