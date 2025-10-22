import React from 'react';
import { useAllTrades, useStudents } from '@/hooks/trades/useTrades';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminTrades() {
  const { data: trades, isLoading: tradesLoading } = useAllTrades();
  const { data: students } = useStudents();

  // Buscar informações das cartas
  const { data: cards } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name, rarity');
      if (error) throw error;
      return data;
    },
  });

  if (tradesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Criar mapa de estudantes
  const studentsMap = students?.reduce((acc, student) => {
    acc[student.id] = student.name || student.email;
    return acc;
  }, {} as Record<string, string>) || {};

  // Criar mapa de cartas
  const cardsMap = cards?.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {} as Record<string, { name: string; rarity: string }>) || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Aceita</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600';
      case 'rare':
        return 'text-blue-600';
      case 'legendary':
        return 'text-purple-600';
      case 'mythic':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Gerenciar Trocas</h1>
        <p className="text-muted-foreground">Visualize todas as trocas realizadas entre estudantes</p>
      </div>

      <div className="grid gap-4">
        {trades && trades.length > 0 ? (
          trades.map((trade) => (
            <Card key={trade.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Troca #{trade.id.slice(0, 8)}
                  </CardTitle>
                  {getStatusBadge(trade.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(trade.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  {/* Quem oferece */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {studentsMap[trade.from_user_id]?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">De</p>
                        <p className="text-xs text-muted-foreground">
                          {studentsMap[trade.from_user_id] || 'Usuário desconhecido'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Oferece:</p>
                      {trade.offered_coins > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Coins className="h-4 w-4 text-yellow-600" />
                          <span>{trade.offered_coins} moedas</span>
                        </div>
                      )}
                      {Object.entries(trade.offered_cards || {}).map(([cardId, quantity]) => {
                        const card = cardsMap[cardId];
                        return (
                          <div key={cardId} className="text-sm">
                            <span className={getRarityColor(card?.rarity || 'common')}>
                              {card?.name || 'Carta desconhecida'}
                            </span>
                            <span className="text-muted-foreground"> x{quantity as number}</span>
                          </div>
                        );
                      })}
                      {trade.offered_coins === 0 && Object.keys(trade.offered_cards || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground italic">Nenhum item</p>
                      )}
                    </div>
                  </div>

                  {/* Seta */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* Quem recebe */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-secondary-foreground">
                          {studentsMap[trade.to_user_id]?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Para</p>
                        <p className="text-xs text-muted-foreground">
                          {studentsMap[trade.to_user_id] || 'Usuário desconhecido'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Recebe:</p>
                      {trade.requested_coins > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Coins className="h-4 w-4 text-yellow-600" />
                          <span>{trade.requested_coins} moedas</span>
                        </div>
                      )}
                      {Object.entries(trade.requested_cards || {}).map(([cardId, quantity]) => {
                        const card = cardsMap[cardId];
                        return (
                          <div key={cardId} className="text-sm">
                            <span className={getRarityColor(card?.rarity || 'common')}>
                              {card?.name || 'Carta desconhecida'}
                            </span>
                            <span className="text-muted-foreground"> x{quantity as number}</span>
                          </div>
                        );
                      })}
                      {trade.requested_coins === 0 && Object.keys(trade.requested_cards || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground italic">Nenhum item</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma troca registrada ainda</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}