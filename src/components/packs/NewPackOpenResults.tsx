import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Star, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewPackOpenResultsProps {
  isOpen: boolean;
  onClose: () => void;
  packName: string;
  cardsReceived: {
    card_id: string;
    name: string;
    rarity: string;
    quantity: number;
  }[];
}

export function NewPackOpenResults({ isOpen, onClose, packName, cardsReceived }: NewPackOpenResultsProps) {
  if (!isOpen) return null;

  const getRarityStyles = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return {
          gradient: 'from-gray-500/20 to-gray-600/20',
          border: 'border-gray-400',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Star
        };
      case 'rare':
        return {
          gradient: 'from-blue-500/20 to-blue-600/20',
          border: 'border-blue-400',
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: Sparkles
        };
      case 'legendary':
        return {
          gradient: 'from-purple-500/20 to-purple-600/20',
          border: 'border-purple-400',
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: Zap
        };
      case 'mythic':
        return {
          gradient: 'from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-400',
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: Crown
        };
      default:
        return {
          gradient: 'from-gray-500/20 to-gray-600/20',
          border: 'border-gray-400',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Star
        };
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'Comum';
      case 'rare': return 'Rara';
      case 'legendary': return 'Lendária';
      case 'mythic': return 'Mítica';
      default: return rarity;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-500 shadow-2xl border-2">
        <CardHeader className="text-center relative pb-8 bg-gradient-to-br from-primary/10 to-primary/5">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full mb-4 shadow-lg animate-bounce">
              <Gift className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Pacote Aberto! 🎉
            </h2>
            
            <p className="text-muted-foreground text-lg">
              {packName}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-1">Suas Novas Cartas</h3>
            <p className="text-sm text-muted-foreground">
              {cardsReceived.length} {cardsReceived.length === 1 ? 'carta adicionada' : 'cartas adicionadas'} à sua coleção
            </p>
          </div>
          
          <div className="grid gap-4">
            {cardsReceived.map((card, index) => {
              const styles = getRarityStyles(card.rarity);
              const Icon = styles.icon;
              
              return (
                <div
                  key={`${card.card_id}-${index}`}
                  className={cn(
                    "relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl",
                    "bg-gradient-to-br",
                    styles.gradient,
                    styles.border,
                    "animate-in slide-in-from-bottom-4"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow effect for rare cards */}
                  {(card.rarity.toLowerCase() === 'legendary' || card.rarity.toLowerCase() === 'mythic') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-background rounded-lg shadow-md">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{card.name}</p>
                        <Badge 
                          className={cn(
                            "text-xs font-semibold border-2",
                            styles.bg,
                            styles.text,
                            styles.border
                          )}
                        >
                          {getRarityLabel(card.rarity)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
                        <span className="text-xs text-muted-foreground block">Quantidade</span>
                        <span className="text-3xl font-bold">×{card.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {cardsReceived.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8" />
              </div>
              <p className="text-lg">Nenhuma carta foi recebida</p>
            </div>
          )}
          
          <Button 
            onClick={onClose} 
            className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            Continuar Explorando
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
