import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Package, Calendar, Coins } from 'lucide-react';
import { usePackPurchases } from '@/hooks/packs/usePackQueries';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PackPurchaseHistoryProps {
  userId: string;
}

export function PackPurchaseHistory({ userId }: PackPurchaseHistoryProps) {
  const { data: purchases, isLoading } = usePackPurchases(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma compra realizada</h3>
            <p className="text-muted-foreground">
              Você ainda não comprou nenhum pacote de cartas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Compras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div 
              key={purchase.id} 
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{purchase.pack?.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={purchase.pack?.pack_type === 'random' ? 'default' : 'secondary'}>
                      {purchase.pack?.pack_type === 'random' ? 'Aleatório' : 'Fixo'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(purchase.purchased_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 font-medium">
                  <Coins className="w-4 h-4 text-primary" />
                  {purchase.coins_spent}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(purchase.cards_received) ? purchase.cards_received.length : 0} cartas
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}