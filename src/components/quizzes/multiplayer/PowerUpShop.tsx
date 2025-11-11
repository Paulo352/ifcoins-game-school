import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePowerUps, useUsePowerUp } from '@/hooks/quizzes/usePowerUps';
import { Zap, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface PowerUpShopProps {
  roomId: string;
  currentQuestionId?: string;
  onPowerUpUsed?: (type: string) => void;
}

export function PowerUpShop({ roomId, currentQuestionId, onPowerUpUsed }: PowerUpShopProps) {
  const { profile } = useAuth();
  const { data: powerUps } = usePowerUps();
  const usePowerUpMutation = useUsePowerUp();

  const handleUse = (powerUp: any) => {
    if (!currentQuestionId) return;
    
    usePowerUpMutation.mutate(
      {
        roomId,
        powerUpId: powerUp.id,
        questionId: currentQuestionId,
        costCoins: powerUp.cost_coins
      },
      {
        onSuccess: () => {
          onPowerUpUsed?.(powerUp.type);
        }
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Power-ups
        </CardTitle>
        <CardDescription>
          Seu saldo: <span className="font-bold text-primary">{profile?.coins || 0}</span> <Coins className="w-4 h-4 inline" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {powerUps?.map((powerUp: any) => {
          const canAfford = (profile?.coins || 0) >= powerUp.cost_coins;
          
          return (
            <div key={powerUp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{powerUp.icon}</span>
                  <div>
                    <p className="font-medium">{powerUp.name}</p>
                    <p className="text-xs text-muted-foreground">{powerUp.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {powerUp.cost_coins}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleUse(powerUp)}
                  disabled={!canAfford || !currentQuestionId || usePowerUpMutation.isPending}
                >
                  Usar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
