import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailablePacks, useBuyPack, usePackPurchases } from '@/hooks/packs/usePacks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Coins, Sparkles, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NewPackOpenResults } from './NewPackOpenResults';
import { cn } from '@/lib/utils';

export function NewPackShop() {
  const { profile } = useAuth();
  const { data: packs, isLoading } = useAvailablePacks();
  const { data: userPurchases } = usePackPurchases(profile?.id);
  const buyPack = useBuyPack();
  const [lastPurchaseResult, setLastPurchaseResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const getUserPurchaseCount = (packId: string) => {
    return userPurchases?.filter(purchase => purchase.pack_id === packId).length || 0;
  };

  const handleBuyPack = (packId: string, packName: string, price: number) => {
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar pacotes",
        variant: "destructive",
      });
      return;
    }

    if (profile.coins < price) {
      toast({
        title: "Moedas insuficientes",
        description: `Você precisa de ${price} moedas para comprar este pacote`,
        variant: "destructive",
      });
      return;
    }
    
    buyPack.mutate({
      packId,
      userId: profile.id
    }, {
      onSuccess: (result) => {
        if (result.cards_received && result.cards_received.length > 0) {
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

  const getRarityGradient = (packType: string) => {
    if (packType === 'fixed') {
      return 'from-emerald-500/20 to-teal-500/20';
    }
    return 'from-purple-500/20 to-pink-500/20';
  };

  const getRarityBorder = (packType: string) => {
    if (packType === 'fixed') {
      return 'border-emerald-500/30';
    }
    return 'border-purple-500/30';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!packs || packs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-16">
          <div className="relative inline-block mb-6">
            <Package className="w-20 h-20 text-muted-foreground/50" />
            <div className="absolute -top-2 -right-2 bg-background rounded-full p-2">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-3">Nenhum pacote disponível</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Não há pacotes disponíveis para compra no momento. Volte mais tarde para descobrir novas cartas!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Loja de Pacotes</span>
        </div>
        <h2 className="text-4xl font-bold">Descubra Novas Cartas</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compre pacotes e expanda sua coleção com cartas incríveis!
        </p>
      </div>

      {/* User Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suas Moedas</p>
                <p className="text-2xl font-bold">{profile?.coins || 0}</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-muted-foreground">Pacotes Comprados</p>
              <p className="text-2xl font-bold">{userPurchases?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => {
          const userPurchaseCount = getUserPurchaseCount(pack.id);
          const remainingPurchases = pack.limit_per_student - userPurchaseCount;
          const canPurchase = remainingPurchases > 0 && pack.available;
          const canAfford = (profile?.coins || 0) >= pack.price;

          return (
            <Card 
              key={pack.id} 
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                "border-2",
                getRarityBorder(pack.pack_type)
              )}
            >
              {/* Gradient Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50",
                getRarityGradient(pack.pack_type)
              )} />

              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={pack.pack_type === 'random' ? 'default' : 'secondary'}>
                      {pack.pack_type === 'random' ? '🎲 Aleatório' : '📦 Fixo'}
                    </Badge>
                    {!canPurchase && (
                      <Badge variant="destructive" className="text-xs">
                        {remainingPurchases === 0 ? '🔒 Limite' : '⏸️ Indisponível'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-2xl">{pack.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold text-primary text-xl">{pack.price}</span>
                  <span>moedas</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {/* Purchase Info */}
                <div className="flex items-center justify-between text-sm bg-background/60 backdrop-blur-sm rounded-lg p-3">
                  <span className="text-muted-foreground">Compras restantes:</span>
                  <span className="font-bold text-lg">
                    {remainingPurchases} / {pack.limit_per_student}
                  </span>
                </div>

                {/* Probabilities for Random Packs */}
                {pack.pack_type === 'random' && (
                  <div className="space-y-2 bg-background/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">📊 Probabilidades:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-500" />
                          <span className="text-sm">Comum</span>
                        </div>
                        <span className="font-bold">{pack.probability_common}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-sm">Rara</span>
                        </div>
                        <span className="font-bold">{pack.probability_rare}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="text-sm">Lendária</span>
                        </div>
                        <span className="font-bold">{pack.probability_legendary}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-sm">Mítica</span>
                        </div>
                        <span className="font-bold">{pack.probability_mythic}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Pack Info */}
                {pack.pack_type === 'fixed' && (
                  <div className="bg-background/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-muted-foreground text-center">
                      ✨ Contém cartas específicas pré-definidas
                    </p>
                  </div>
                )}

                {/* Buy Button */}
                <Button 
                  onClick={() => handleBuyPack(pack.id, pack.name, pack.price)}
                  disabled={!canPurchase || !canAfford || buyPack.isPending}
                  className="w-full h-12 text-base font-semibold"
                  variant={canPurchase && canAfford ? "default" : "secondary"}
                >
                  {buyPack.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                      Comprando...
                    </>
                  ) : !canAfford ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Moedas Insuficientes
                    </>
                  ) : !canPurchase ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {remainingPurchases === 0 ? 'Limite Atingido' : 'Indisponível'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Comprar Pacote
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Results Modal */}
      <NewPackOpenResults
        isOpen={showResults}
        onClose={handleCloseResults}
        packName={lastPurchaseResult?.packName || ''}
        cardsReceived={lastPurchaseResult?.cardsReceived || []}
      />
    </div>
  );
}
