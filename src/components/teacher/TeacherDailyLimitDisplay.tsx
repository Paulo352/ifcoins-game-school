import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useTeacherDailyLimit } from '@/hooks/useTeacherDailyLimit';

export function TeacherDailyLimitDisplay() {
  const { dailyCoins, dailyLimit, remainingCoins, percentageUsed, limitReached } = useTeacherDailyLimit();

  const getStatusColor = () => {
    if (percentageUsed >= 100) return 'text-red-600';
    if (percentageUsed >= 80) return 'text-orange-600';
    if (percentageUsed >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (percentageUsed >= 100) return 'bg-red-500';
    if (percentageUsed >= 80) return 'bg-orange-500';
    if (percentageUsed >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (limitReached) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (percentageUsed >= 80) return <AlertCircle className="h-5 w-5 text-orange-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusText = () => {
    if (limitReached) return 'Limite Atingido';
    if (percentageUsed >= 80) return 'Limite Próximo';
    return 'Disponível';
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Seu Limite Diário
          </div>
          <Badge 
            variant={limitReached ? "destructive" : percentageUsed >= 80 ? "secondary" : "default"}
            className="gap-1"
          >
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Distribuídas</p>
            <p className={`text-xl font-bold ${getStatusColor()}`}>
              {dailyCoins}
            </p>
          </div>
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Limite</p>
            <p className="text-xl font-bold text-foreground">
              {dailyLimit}
            </p>
          </div>
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Restantes</p>
            <p className={`text-xl font-bold ${remainingCoins > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {remainingCoins}
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uso do Limite</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {percentageUsed}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min(percentageUsed, 100)} 
              className="h-3"
            />
            <div 
              className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Mensagens de status */}
        {limitReached ? (
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700">
                  Limite Diário Atingido
                </p>
                <p className="text-xs text-red-600">
                  Você distribuiu todas as {dailyLimit} moedas disponíveis hoje. 
                  O limite será resetado automaticamente à meia-noite.
                </p>
              </div>
            </div>
          </div>
        ) : percentageUsed >= 80 ? (
          <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-orange-700">
                  Atenção: Limite Quase Atingido
                </p>
                <p className="text-xs text-orange-600">
                  Restam apenas {remainingCoins} moedas do seu limite diário de {dailyLimit}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-green-700">
                  Você tem {remainingCoins} moedas disponíveis
                </p>
                <p className="text-xs text-green-600">
                  Continue distribuindo moedas para recompensar seus estudantes!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info adicional */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            <strong>Reset automático:</strong> Seu limite diário é resetado todos os dias à meia-noite. 
            O limite atual é de <strong>{dailyLimit} moedas por dia</strong> e é configurado pelo administrador.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
