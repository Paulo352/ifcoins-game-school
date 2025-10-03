import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, Save, RefreshCw } from 'lucide-react';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function TeacherDailyLimitConfig() {
  const { getConfig, updateConfig, loading, config } = useAdminConfig();
  const [dailyLimit, setDailyLimit] = useState('500');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar com as mudanças do config em tempo real
  useEffect(() => {
    const currentLimit = getConfig('teacher_daily_limit', '500');
    setDailyLimit(currentLimit);
  }, [config, getConfig]);

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

    setIsSaving(true);
    try {
      await updateConfig('teacher_daily_limit', dailyLimit);
      toast.success('✅ Limite atualizado! Professores verão a mudança instantaneamente.');
      console.log('✅ Admin salvou novo limite:', dailyLimit);
    } catch (error) {
      console.error('❌ Erro ao atualizar limite:', error);
      toast.error('Erro ao atualizar limite diário');
    } finally {
      setIsSaving(false);
    }
  };

  const currentConfigLimit = getConfig('teacher_daily_limit', '500');
  const hasChanges = dailyLimit !== currentConfigLimit;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Limite Diário de Professores
          </div>
          <Badge variant="outline" className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Sincronizado em tempo real
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure quantas moedas cada professor pode distribuir por dia. A mudança é aplicada imediatamente para todos os professores.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="teacherLimit">Moedas por Dia (por professor)</Label>
            <Input
              id="teacherLimit"
              type="number"
              min="1"
              max="10000"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              placeholder="500"
              disabled={isSaving}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Limite atual: <strong>{currentConfigLimit} moedas</strong> por professor por dia
              </p>
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Não salvo
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges || loading} 
          className="w-full"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Limite
            </>
          )}
        </Button>

        <div className="bg-muted p-3 rounded-lg space-y-2">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Como Funciona a Sincronização
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✅ Atualização instantânea: mudanças aparecem para professores em tempo real</li>
            <li>🔄 Sincronização automática: sem necessidade de recarregar a página</li>
            <li>📊 Limite compartilhado: vale para todos os professores ao mesmo tempo</li>
            <li>🕐 Reset diário: contador zera automaticamente à meia-noite</li>
            <li>👀 Visibilidade total: professores veem limite atual e porcentagem usada</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <p className="text-xs text-green-700 font-medium">
            💡 Exemplo: Se você alterar de 500 para 400 moedas, os professores verão "400" como novo limite instantaneamente, sem precisar atualizar a página.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
