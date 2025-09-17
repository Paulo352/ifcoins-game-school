import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailablePacks, useBuyPack, usePackPurchases } from '@/hooks/packs/usePacks';
import { PackCard } from './PackCard';
import { PackOpenResults } from './PackOpenResults';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

export function PackShop() {
  const { profile } = useAuth();
  const { data: packs, isLoading } = useAvailablePacks();
  const { data: userPurchases } = usePackPurchases(profile?.id);
  const buyPack = useBuyPack();
  const [lastPurchaseResult, setLastPurchaseResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // Calcular quantas vezes o usuário comprou cada pacote
  const getUserPurchaseCount = (packId: string) => {
    return userPurchases?.filter(purchase => purchase.pack_id === packId).length || 0;
  };

  const handleBuyPack = (packId: string) => {
    if (!profile?.id) return;
    
    buyPack.mutate({
      packId,
      userId: profile.id
    }, {
      onSuccess: (result) => {
        if (result.cards_received && result.cards_received.length > 0) {
          const packName = packs?.find(p => p.id === packId)?.name || 'Pacote';
          setLastPurchaseResult({
            packName,
            cardsReceived: result.cards_received
          });
          setShowResults(true);
        }
      }
    });
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setLastPurchaseResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!packs || packs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum pacote disponível</h3>
          <p className="text-muted-foreground">
            Não há pacotes disponíveis para compra no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Loja de Pacotes</h2>
        <p className="text-muted-foreground">
          Compre pacotes de cartas e descubra novas adições para sua coleção!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onPurchase={handleBuyPack}
            isPurchasing={buyPack.isPending}
            userPurchases={getUserPurchaseCount(pack.id)}
          />
        ))}
      </div>

      {/* Modal de resultados da compra */}
      <PackOpenResults
        isOpen={showResults}
        onClose={handleCloseResults}
        packName={lastPurchaseResult?.packName || ''}
        cardsReceived={lastPurchaseResult?.cardsReceived || []}
      />
    </div>
  );
}