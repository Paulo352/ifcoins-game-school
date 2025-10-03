import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Save } from 'lucide-react';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { toast } from 'sonner';

export function TeacherDailyLimitConfig() {
  const { getConfig, updateConfig, loading } = useAdminConfig();
  const [dailyLimit, setDailyLimit] = useState('500');

  useEffect(() => {
    const currentLimit = getConfig('teacher_daily_limit', '500');
    setDailyLimit(currentLimit);
  }, [getConfig]);

  const handleSave = async () => {
    const limitValue = parseInt(dailyLimit);
    
    if (isNaN(limitValue) || limitValue < 1) {
      toast.error('Por favor, insira um valor válido maior que 0');
      return;
    }

    if (limitValue > 10000) {
      toast.error('O limite máximo é de 10.000 moedas por dia');
      return;
    }

    await updateConfig('teacher_daily_limit', dailyLimit);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Limite Diário de Professores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure quantas moedas cada professor pode distribuir por dia
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="teacherLimit">Moedas por Dia</Label>
            <Input
              id="teacherLimit"
              type="number"
              min="1"
              max="10000"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground">
              Valor atual: {dailyLimit} moedas por professor por dia
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar Limite
        </Button>

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">ℹ️ Informação</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Este limite se aplica a todos os professores</li>
            <li>• O contador é resetado diariamente à meia-noite</li>
            <li>• Professores veem quanto já distribuíram no dia</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
