import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Coins } from 'lucide-react';
import { Trade } from '@/hooks/trades/useTrades';
import { UserCard } from '@/hooks/cards/useCards';

interface TradeCardProps {
  trade: Trade;
  isReceived?: boolean;
  userCards: UserCard[];
  allCards?: { id: string; name: string }[];
  onAccept?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
  profilesMap: Record<string, { name: string; email: string }>;
}

export function TradeCard({ 
  trade, 
  isReceived = false, 
  userCards, 
  allCards = [],
  onAccept, 
  onReject,
  profilesMap 
}: TradeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'rejected': return 'Rejeitada';
      default: return status;
    }
  };

  const getCardName = (cardId: string) => {
    // Primeiro tenta nas cartas do usuário
    const userCard = userCards.find(uc => uc.card.id === cardId);
    if (userCard) return userCard.card.name;
    
    // Depois tenta na lista geral de cartas (todas as cartas do sistema)
    const generalCard = allCards.find(c => c.id === cardId);
    if (generalCard) return generalCard.name;
    
    // Fallback para código
    return `Carta ${cardId.slice(0, 8)}`;
  };

  const otherUserId = isReceived ? trade.from_user_id : trade.to_user_id;
  const otherUser = profilesMap[otherUserId];

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="text-sm">
            <p className="font-medium">
              {isReceived ? 'De' : 'Para'}: {otherUser?.name || 'Usuário desconhecido'}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(trade.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <Badge className={getStatusColor(trade.status)}>
            {getStatusText(trade.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Oferece */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-green-600">
              {isReceived ? 'Oferece:' : 'Você oferece:'}
            </h4>
            
            {trade.offered_coins > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Coins className="h-3 w-3" />
                <span>{trade.offered_coins} moedas</span>
              </div>
            )}
            
            {Object.entries(trade.offered_cards).map(([cardId, quantity]) => (
              quantity > 0 && (
                <div key={cardId} className="text-xs">
                  <span className="font-medium">{quantity}x</span> {getCardName(cardId)}
                </div>
              )
            ))}
            
            {trade.offered_coins === 0 && Object.values(trade.offered_cards).every(q => q === 0) && (
              <p className="text-xs text-gray-500">Nada</p>
            )}
          </div>

          {/* Solicita */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-blue-600">
              {isReceived ? 'Solicita:' : 'Você solicita:'}
            </h4>
            
            {trade.requested_coins > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Coins className="h-3 w-3" />
                <span>{trade.requested_coins} moedas</span>
              </div>
            )}
            
            {Object.entries(trade.requested_cards).map(([cardId, quantity]) => (
              quantity > 0 && (
                <div key={cardId} className="text-xs">
                  <span className="font-medium">{quantity}x</span> {getCardName(cardId)}
                </div>
              )
            ))}
            
            {trade.requested_coins === 0 && Object.values(trade.requested_cards).every(q => q === 0) && (
              <p className="text-xs text-gray-500">Nada</p>
            )}
          </div>
        </div>

        {isReceived && trade.status === 'pending' && onAccept && onReject && (
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => onAccept(trade.id)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-3 w-3 mr-1" />
              Aceitar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onReject(trade.id)}
            >
              <X className="h-3 w-3 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}