import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EnhancedCardImage } from './EnhancedCardSystem';

interface CardData {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic' | 'epic';
  imageUrl: string;
  available: boolean;
  price: number;
  description: string;
  quantity?: number;
}

interface CardDisplayProps {
  card: CardData;
  className?: string;
  showPrice?: boolean;
  showQuantity?: boolean;
}

const rarityStyles = {
  common: 'bg-gray-100 border-gray-300 text-gray-800',
  rare: 'bg-blue-100 border-blue-300 text-blue-800',
  legendary: 'bg-orange-100 border-orange-300 text-orange-800',
  mythic: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  epic: 'bg-purple-100 border-purple-300 text-purple-800'
};

const rarityLabels = {
  common: 'Comum',
  rare: 'Raro',
  legendary: 'Lendário',
  mythic: 'Mítico',
  epic: 'Épica'
};

export function CardDisplay({ card, className, showPrice = false, showQuantity = false }: CardDisplayProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="p-0">
        <div className="relative">
          <EnhancedCardImage
            src={card.imageUrl || ''}
            alt={card.name}
            className="w-full h-48"
          />
          <div className="absolute top-2 right-2">
            <Badge className={cn('text-xs font-medium', rarityStyles[card.rarity])}>
              {rarityLabels[card.rarity]}
            </Badge>
          </div>
          {showQuantity && card.quantity && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                x{card.quantity}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">{card.name}</CardTitle>
        <CardDescription className="text-sm mb-3 line-clamp-2">
          {card.description}
        </CardDescription>
        {showPrice && (
          <div className="flex justify-between items-center">
            <span className="font-bold text-primary text-lg">
              {card.price} IFCoins
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}