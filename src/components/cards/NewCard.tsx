import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingCart, Eye } from 'lucide-react';

interface CardData {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic' | 'epic';
  image_url: string | null;
  price: number;
  description?: string;
  quantity?: number;
  available?: boolean;
}

interface NewCardProps {
  card: CardData;
  onBuy?: (cardId: string) => void;
  onView?: (cardId: string) => void;
  showPrice?: boolean;
  showQuantity?: boolean;
  showActions?: boolean;
  className?: string;
}

const rarityColors = {
  common: 'bg-gray-500 text-white',
  rare: 'bg-blue-500 text-white', 
  legendary: 'bg-orange-500 text-white',
  mythic: 'bg-cyan-500 text-white',
  epic: 'bg-purple-500 text-white'
};

const rarityLabels = {
  common: 'Comum',
  rare: 'Rara',
  legendary: 'Lendária', 
  mythic: 'Mítica',
  epic: 'Épica'
};

const rarityBorders = {
  common: 'border-gray-300',
  rare: 'border-blue-300',
  legendary: 'border-orange-300',
  mythic: 'border-cyan-300',
  epic: 'border-purple-300'
};

export function NewCard({ 
  card, 
  onBuy, 
  onView,
  showPrice = false,
  showQuantity = false, 
  showActions = false,
  className 
}: NewCardProps) {
  const imageUrl = card.image_url?.trim() || '';
  
  console.log('🃏 NewCard - Rendering card:', card.name, 'Image URL:', imageUrl);

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', imageUrl);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ Image failed to load:', imageUrl);
    // Remove broken image instead of showing placeholder
    e.currentTarget.style.display = 'none';
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-lg',
      rarityBorders[card.rarity],
      'border-2',
      !card.available && 'opacity-60',
      className
    )}>
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <Eye className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Sem imagem</p>
            </div>
          </div>
        )}
        
        {/* Rarity Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={cn('text-xs font-medium', rarityColors[card.rarity])}>
            {rarityLabels[card.rarity]}
          </Badge>
        </div>

        {/* Quantity Badge */}
        {showQuantity && card.quantity && card.quantity > 0 && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              x{card.quantity}
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-2">{card.name}</CardTitle>
        {card.description && (
          <CardDescription className="text-sm line-clamp-2">
            {card.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {showPrice && (
          <div className="mb-3">
            <p className="text-lg font-bold text-primary">
              {card.price.toLocaleString('pt-BR')} IFCoins
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            {onBuy && card.available && (
              <Button 
                onClick={() => onBuy(card.id)}
                size="sm"
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Comprar
              </Button>
            )}
            {onView && (
              <Button 
                onClick={() => onView(card.id)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}