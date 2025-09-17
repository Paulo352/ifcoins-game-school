import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, X } from 'lucide-react';

interface PackOpenResultsProps {
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

export function PackOpenResults({ isOpen, onClose, packName, cardsReceived }: PackOpenResultsProps) {
  if (!isOpen) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'legendary':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'mythic':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
      case 'mythic':
        return <Sparkles className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-6 h-6 text-primary" />
            <CardTitle className="text-xl">Pacote Aberto!</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Você abriu: <span className="font-medium">{packName}</span>
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium mb-3">Cartas Recebidas:</h3>
          </div>
          
          <div className="space-y-3">
            {cardsReceived.map((card, index) => (
              <div
                key={`${card.card_id}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
              >
                <div className="flex items-center gap-2">
                  {getRarityIcon(card.rarity)}
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRarityColor(card.rarity)}`}
                    >
                      {card.rarity}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">x{card.quantity}</span>
                </div>
              </div>
            ))}
          </div>
          
          {cardsReceived.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhuma carta foi recebida.</p>
            </div>
          )}
          
          <Button onClick={onClose} className="w-full mt-6">
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}