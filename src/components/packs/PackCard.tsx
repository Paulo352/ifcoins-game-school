import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Coins } from 'lucide-react';
import { Pack } from '@/hooks/packs/usePackQueries';

interface PackCardProps {
  pack: Pack;
  onPurchase?: (packId: string) => void;
  isPurchasing?: boolean;
  showPurchaseButton?: boolean;
  userPurchases?: number;
}

export function PackCard({ 
  pack, 
  onPurchase, 
  isPurchasing = false, 
  showPurchaseButton = true,
  userPurchases = 0 
}: PackCardProps) {
  const canPurchase = userPurchases < pack.limit_per_student && pack.available;
  const remainingPurchases = pack.limit_per_student - userPurchases;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'legendary': return 'bg-purple-500';
      case 'mythic': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{pack.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={pack.pack_type === 'random' ? 'default' : 'secondary'}>
                  {pack.pack_type === 'random' ? 'Aleatório' : 'Fixo'}
                </Badge>
                <Badge variant={pack.available ? 'default' : 'secondary'}>
                  {pack.available ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg font-bold text-primary">
              <Coins className="w-4 h-4" />
              {pack.price}
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingPurchases > 0 ? `${remainingPurchases} restantes` : 'Limite atingido'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {pack.pack_type === 'random' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Probabilidades:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRarityColor('common')}`} />
                <span className="text-sm">Comum: {pack.probability_common}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRarityColor('rare')}`} />
                <span className="text-sm">Rara: {pack.probability_rare}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRarityColor('legendary')}`} />
                <span className="text-sm">Lendária: {pack.probability_legendary}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRarityColor('mythic')}`} />
                <span className="text-sm">Mítica: {pack.probability_mythic}%</span>
              </div>
            </div>
          </div>
        )}
        
        {pack.pack_type === 'fixed' && (
          <div className="text-sm text-muted-foreground">
            <p>Contém cartas específicas pré-definidas</p>
          </div>
        )}
        
        {showPurchaseButton && (
          <Button 
            onClick={() => onPurchase?.(pack.id)}
            disabled={!canPurchase || isPurchasing}
            className="w-full"
            variant={canPurchase ? "default" : "secondary"}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isPurchasing 
              ? 'Comprando...' 
              : !pack.available 
                ? 'Indisponível' 
                : remainingPurchases === 0 
                  ? 'Limite atingido'  
                  : `Comprar por ${pack.price} moedas`
            }
          </Button>
        )}
      </CardContent>
    </Card>
  );
}