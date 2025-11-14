import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Search } from 'lucide-react';
import { UserCard } from '@/hooks/cards/useCards';

interface CardSelectorProps {
  userCards: UserCard[];
  selectedCards: Record<string, number>;
  onCardChange: (cardId: string, quantity: number) => void;
  title: string;
  variant?: 'offer' | 'request';
}

export function CardSelector({ 
  userCards, 
  selectedCards, 
  onCardChange, 
  title, 
  variant = 'offer' 
}: CardSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = userCards
    .filter((userCard) => Boolean(userCard.card))
    .filter((userCard) =>
      (userCard.card?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'legendary': return 'bg-purple-100 text-purple-800';
      case 'mythic': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canDecrease = (cardId: string) => {
    return (selectedCards[cardId] || 0) > 0;
  };

  const canIncrease = (cardId: string) => {
    const userCard = userCards.find(uc => uc.card?.id === cardId);
    const currentSelected = selectedCards[cardId] || 0;
    return userCard && currentSelected < userCard.quantity;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-lg ${variant === 'offer' ? 'text-green-600' : 'text-blue-600'}`}>
          {title}
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cartas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredCards.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {userCards.length === 0 ? 'Você não possui cartas' : 'Nenhuma carta encontrada'}
            </p>
          ) : (
            filteredCards.map((userCard) => {
              const selectedQuantity = selectedCards[userCard.card.id] || 0;
              
              return (
                <div key={userCard.card.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{userCard.card.name}</h4>
                      <Badge className={getRarityColor(userCard.card.rarity)}>
                        {userCard.card.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Você possui: {userCard.quantity}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCardChange(userCard.card.id, Math.max(0, selectedQuantity - 1))}
                      disabled={!canDecrease(userCard.card.id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {selectedQuantity}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCardChange(userCard.card.id, selectedQuantity + 1)}
                      disabled={!canIncrease(userCard.card.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {Object.keys(selectedCards).some(cardId => selectedCards[cardId] > 0) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-sm mb-2">Selecionadas:</h5>
            <div className="space-y-1">
              {Object.entries(selectedCards)
                .filter(([_, quantity]) => quantity > 0)
                .map(([cardId, quantity]) => {
                  const userCard = userCards.find(uc => uc.card.id === cardId);
                  return userCard ? (
                    <div key={cardId} className="flex justify-between text-xs">
                      <span>{userCard.card.name}</span>
                      <span className="font-medium">{quantity}x</span>
                    </div>
                  ) : null;
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}