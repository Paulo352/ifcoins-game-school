import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBank } from '@/hooks/bank/useBank';
import { Building2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ImprovedBankDashboard() {
  const { data: bank } = useBank();
  const queryClient = useQueryClient();
  const [addAmount, setAddAmount] = useState<number>(0);
  const [removeAmount, setRemoveAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const handleAddCoins = async () => {
    if (!bank || addAmount <= 0) return;
    setProcessing(true);

    try {
      const newTotal = bank.total_coins + addAmount;
      
      const { error } = await supabase
        .from('bank')
        .update({ 
          total_coins: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', bank.id);

      if (error) throw error;

      toast({
        title: 'Moedas Adicionadas!',
        description: `${addAmount.toLocaleString()} IFCoins foram adicionados ao banco`,
      });
      
      setAddAmount(0);
      queryClient.invalidateQueries({ queryKey: ['bank'] });
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
      const newTotal = bank.total_coins - removeAmount;
      
      const { error } = await supabase
        .from('bank')
        .update({ 
          total_coins: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', bank.id);

      if (error) throw error;

      toast({
        title: 'Moedas Removidas!',
        description: `${removeAmount.toLocaleString()} IFCoins foram removidos do banco`,
      });
      
      setRemoveAmount(0);
      queryClient.invalidateQueries({ queryKey: ['bank'] });
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

  if (!bank) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const availableCoins = bank.total_coins - bank.coins_in_circulation;
  const circulationPercentage = bank.total_coins > 0 
    ? (bank.coins_in_circulation / bank.total_coins) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Visão Geral do IFBank
          </CardTitle>
          <CardDescription>
            Gerencie as moedas e monitore a circulação do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total no Banco */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total no Banco
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                    {bank.total_coins.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    IFCoins
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </div>

            {/* Em Circulação */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Em Circulação
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                    {bank.coins_in_circulation.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {circulationPercentage.toFixed(1)}% do total
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </div>

            {/* Disponível */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Disponível
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                    {availableCoins.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Para empréstimos
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Moedas</CardTitle>
          <CardDescription>
            Adicione ou remova moedas do banco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Adicionar Moedas</TabsTrigger>
              <TabsTrigger value="remove">Remover Moedas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="add-amount">Quantidade de Moedas</Label>
                <Input
                  id="add-amount"
                  type="number"
                  min="1"
                  value={addAmount || ''}
                  onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
                  placeholder="Digite a quantidade"
                />
              </div>
              <Button
                onClick={handleAddCoins}
                disabled={processing || addAmount <= 0}
                className="w-full"
                size="lg"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Adicionar {addAmount > 0 ? addAmount.toLocaleString() : ''} IFCoins
              </Button>
            </TabsContent>
            
            <TabsContent value="remove" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="remove-amount">Quantidade de Moedas</Label>
                <Input
                  id="remove-amount"
                  type="number"
                  min="1"
                  max={availableCoins}
                  value={removeAmount || ''}
                  onChange={(e) => setRemoveAmount(parseInt(e.target.value) || 0)}
                  placeholder="Digite a quantidade"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo disponível: {availableCoins.toLocaleString('pt-BR')} IFCoins
                </p>
              </div>
              <Button
                onClick={handleRemoveCoins}
                disabled={processing || removeAmount <= 0 || removeAmount > availableCoins}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Remover {removeAmount > 0 ? removeAmount.toLocaleString() : ''} IFCoins
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
