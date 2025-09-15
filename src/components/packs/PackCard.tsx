import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Package, Sparkles } from 'lucide-react';
import { Pack } from '@/hooks/packs/usePacks';

interface PackCardProps {
  pack: Pack;
  onBuy?: (packId: string) => void;
  userCoins?: number;
  loading?: boolean;
}

export function PackCard({ pack, onBuy, userCoins = 0, loading = false }: PackCardProps) {
  const canAfford = userCoins >= pack.price;
  
  const getRarityColor = (probability: number) => {
    if (probability >= 50) return 'text-gray-600';
    if (probability >= 25) return 'text-blue-600';
    if (probability >= 10) return 'text-purple-600';
    return 'text-yellow-600';
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="absolute top-2 right-2">
        <Badge variant={pack.pack_type === 'random' ? 'default' : 'secondary'}>
          {pack.pack_type === 'random' ? 'Aleatório' : 'Fixo'}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{pack.name}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-lg">{pack.price}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Limite: {pack.limit_per_student}
          </div>
        </div>
        
        {pack.pack_type === 'random' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Probabilidades:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex justify-between ${getRarityColor(pack.probability_common)}`}>
                <span>Comum:</span>
                <span>{pack.probability_common}%</span>
              </div>
              <div className={`flex justify-between ${getRarityColor(pack.probability_rare)}`}>
                <span>Rara:</span>
                <span>{pack.probability_rare}%</span>
              </div>
              <div className={`flex justify-between ${getRarityColor(pack.probability_legendary)}`}>
                <span>Lendária:</span>
                <span>{pack.probability_legendary}%</span>
              </div>
              <div className={`flex justify-between ${getRarityColor(pack.probability_mythic)}`}>
                <span>Mítica:</span>
                <span>{pack.probability_mythic}%</span>
              </div>
            </div>
          </div>
        )}

        {pack.pack_type === 'fixed' && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              Contém cartas específicas escolhidas pelo admin
            </div>
          </div>
        )}
      </CardContent>
      
      {onBuy && (
        <CardFooter>
          <Button
            onClick={() => onBuy(pack.id)}
            disabled={!canAfford || loading}
            className="w-full"
            variant={canAfford ? 'default' : 'outline'}
          >
            {loading ? (
              'Comprando...'
            ) : canAfford ? (
              'Comprar Pacote'
            ) : (
              'Moedas insuficientes'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}