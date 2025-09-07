import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Coins, Calendar, Users, Settings } from 'lucide-react';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { toast } from 'sonner';

export function DailyCoinsConfig() {
  const { getConfig, updateConfig, loading } = useAdminConfig();
  
  const [localSettings, setLocalSettings] = useState({
    enabled: getConfig('daily_coins_enabled', 'false') === 'true',
    amount: getConfig('daily_coins_amount', '10'),
    days: getConfig('daily_coins_days', 'all'),
    interval: getConfig('daily_coins_interval', '1'),
    targetRoles: getConfig('daily_coins_target_roles', 'student')
  });

  const handleSave = async () => {
    try {
      await Promise.all([
        updateConfig('daily_coins_enabled', localSettings.enabled.toString()),
        updateConfig('daily_coins_amount', localSettings.amount),
        updateConfig('daily_coins_days', localSettings.days),
        updateConfig('daily_coins_interval', localSettings.interval),
        updateConfig('daily_coins_target_roles', localSettings.targetRoles)
      ]);
      
      toast.success('Configurações de moedas diárias salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleDistributeNow = async () => {
    // TODO: Implementar distribuição manual
    toast.info('Distribuição manual será implementada em breve');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-600" />
          Distribuição Automática de Moedas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Distribuição Automática</Label>
            <p className="text-sm text-gray-600">Distribuir moedas automaticamente para usuários</p>
          </div>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={(checked) => 
              setLocalSettings(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {localSettings.enabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dailyAmount">Quantidade de Moedas</Label>
                <Input
                  id="dailyAmount"
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.amount}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="interval">Intervalo (dias)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.interval}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, interval: e.target.value }))
                  }
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">A cada quantos dias distribuir</p>
              </div>
            </div>

            <div>
              <Label>Dias da Semana</Label>
              <Select 
                value={localSettings.days} 
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ ...prev, days: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os dias</SelectItem>
                  <SelectItem value="weekdays">Apenas dias úteis (Seg-Sex)</SelectItem>
                  <SelectItem value="weekends">Apenas fins de semana</SelectItem>
                  <SelectItem value="monday">Apenas segundas-feiras</SelectItem>
                  <SelectItem value="friday">Apenas sextas-feiras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Usuários Alvo</Label>
              <Select 
                value={localSettings.targetRoles} 
                onValueChange={(value) => 
                  setLocalSettings(prev => ({ ...prev, targetRoles: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Apenas Estudantes</SelectItem>
                  <SelectItem value="teacher">Apenas Professores</SelectItem>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading}>
                <Settings className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
              
              <Button variant="outline" onClick={handleDistributeNow}>
                <Calendar className="h-4 w-4 mr-2" />
                Distribuir Agora
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">ℹ️ Como Funciona</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• A distribuição acontece automaticamente baseada nas configurações</li>
                <li>• Apenas usuários ativos receberão as moedas</li>
                <li>• O histórico de distribuições fica registrado no sistema</li>
                <li>• Você pode pausar a distribuição a qualquer momento</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}