import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactions } from '@/hooks/bank/useTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const typeLabels: Record<string, string> = {
  send: 'Envio',
  purchase: 'Compra',
  reward: 'Recompensa',
  loan_granted: 'Empréstimo',
  loan_repaid: 'Pagamento',
  market_sale: 'Venda',
  market_fee: 'Taxa',
  system_buy: 'Sistema'
};

const typeColors: Record<string, string> = {
  send: 'bg-blue-500',
  purchase: 'bg-purple-500',
  reward: 'bg-green-500',
  loan_granted: 'bg-yellow-500',
  loan_repaid: 'bg-green-500',
  market_sale: 'bg-orange-500',
  market_fee: 'bg-red-500',
  system_buy: 'bg-gray-500'
};

export function TransactionHistory() {
  const { data: transactions, isLoading } = useTransactions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico Completo de Transações</CardTitle>
        <CardDescription>
          Todas as movimentações de moedas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">
                        {new Date(tx.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={typeColors[tx.type] || 'bg-gray-500'}>
                          {typeLabels[tx.type] || tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.sender?.name || 'Sistema'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.receiver?.name || 'Sistema'}
                      </TableCell>
                      <TableCell className="font-bold">
                        {tx.amount.toLocaleString('pt-BR')} IFC
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
