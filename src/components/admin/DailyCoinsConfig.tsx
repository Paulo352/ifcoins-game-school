import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Coins } from 'lucide-react';

interface DailyConfig {
  id: string;
  amount: number;
  enabled: boolean;
  target_role: string;
  reset_weekly: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export function DailyCoinsConfig() {
  const [config, setConfig] = useState<DailyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_coin_config')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar configuração',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('daily_coin_config')
        .upsert(config);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Configuração de moedas diárias atualizada',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar configuração',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!config) {
    return <div>Configuração não encontrada</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Distribuição Diária de Moedas
        </CardTitle>
        <CardDescription>
          Configure a distribuição automática de moedas para os alunos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sistema Ativado</Label>
            <p className="text-sm text-muted-foreground">
              Ativar distribuição automática de moedas
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => 
              setConfig({ ...config, enabled: checked })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Quantidade de Moedas</Label>
            <Input
              id="amount"
              type="number"
              value={config.amount}
              onChange={(e) => 
                setConfig({ ...config, amount: parseInt(e.target.value) || 0 })
              }
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="target_role">Destinatários</Label>
            <Select
              value={config.target_role}
              onValueChange={(value) => 
                setConfig({ ...config, target_role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Apenas Alunos</SelectItem>
                <SelectItem value="all">Todos os Usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Resetar Sequência Semanalmente</Label>
            <p className="text-sm text-muted-foreground">
              A sequência de dias consecutivos será resetada toda semana
            </p>
          </div>
          <Switch
            checked={config.reset_weekly}
            onCheckedChange={(checked) => 
              setConfig({ ...config, reset_weekly: checked })
            }
          />
        </div>

        <div>
          <Label className="mb-3 block">Dias de Distribuição</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'monday', label: 'Segunda' },
              { key: 'tuesday', label: 'Terça' },
              { key: 'wednesday', label: 'Quarta' },
              { key: 'thursday', label: 'Quinta' },
              { key: 'friday', label: 'Sexta' },
              { key: 'saturday', label: 'Sábado' },
              { key: 'sunday', label: 'Domingo' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                <Switch
                  checked={config[key as keyof DailyConfig] as boolean}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, [key]: checked })
                  }
                />
                <Label className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={saveConfig} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Como funciona:</strong> Os alunos receberão moedas automaticamente nos dias selecionados. 
            Se um aluno não entrar no sistema em um dia ativo, ele perderá a recompensa daquele dia e sua sequência será quebrada.
            {config.reset_weekly && ' A sequência será resetada toda semana.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}