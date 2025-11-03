import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBank } from '@/hooks/bank/useBank';
import { useTransactions } from '@/hooks/bank/useTransactions';
import { Coins, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BankSettings } from './BankSettings';
import { TransactionHistory } from './TransactionHistory';

export function BankDashboard() {
  const { data: bank, isLoading: bankLoading } = useBank();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();

  if (bankLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const availableCoins = bank ? bank.total_coins - bank.coins_in_circulation : 0;
  const circulationPercentage = bank 
    ? ((bank.coins_in_circulation / bank.total_coins) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">IFBank</h2>
        <p className="text-muted-foreground">
          Sistema econômico e controle de moedas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Moedas
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bank?.total_coins.toLocaleString('pt-BR')} IFCoins
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo total do banco
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Circulação
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bank?.coins_in_circulation.toLocaleString('pt-BR')} IFCoins
            </div>
            <p className="text-xs text-muted-foreground">
              {circulationPercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Disponível
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableCoins.toLocaleString('pt-BR')} IFCoins
            </div>
            <p className="text-xs text-muted-foreground">
              Para novos empréstimos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BankSettings bank={bank} />
        
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas transações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm">
                      {tx.amount.toLocaleString('pt-BR')} IFCoins
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma transação registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionHistory />
    </div>
  );
}
