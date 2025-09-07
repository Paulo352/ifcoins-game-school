import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save, RefreshCw, Database, Shield, Bell, Loader2 } from 'lucide-react';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { DailyCoinsConfig } from '@/components/admin/DailyCoinsConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function Settings() {
  const { profile } = useAuth();
  const { config, loading, updateConfig, getConfig } = useAdminConfig();
  
  const [localSettings, setLocalSettings] = useState({
    system_name: '',
    max_coins_per_reward: '',
    default_student_coins: '',
    max_daily_rewards_per_student: '',
    maintenance_mode: 'false',
    email_notifications: 'true',
    auto_backup: 'true'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setLocalSettings({
        system_name: getConfig('system_name', 'IFCoins - Sistema Educacional Gamificado'),
        max_coins_per_reward: getConfig('max_coins_per_reward', '500'),
        default_student_coins: getConfig('default_student_coins', '100'),
        max_daily_rewards_per_student: getConfig('max_daily_rewards_per_student', '3'),
        maintenance_mode: getConfig('maintenance_mode', 'false'),
        email_notifications: getConfig('email_notifications', 'true'),
        auto_backup: getConfig('auto_backup', 'true')
      });
    }
  }, [config, loading, getConfig]);

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Carregando...</h2>
        <p className="text-gray-600">Verificando permissões...</p>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem acessar as configurações.</p>
        <p className="text-sm text-gray-500 mt-2">Seu perfil atual: {profile.role}</p>
        <p className="text-xs text-gray-400 mt-1">Email: {profile.email}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Carregando Configurações...</h2>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(localSettings).map(([key, value]) =>
        updateConfig(key, value)
      );
      
      await Promise.all(promises);
      toast.success('Todas as configurações foram salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar algumas configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'backup' }
      });

      if (error) throw error;

      toast.success(`Backup realizado com sucesso! Arquivo: ${data.fileName}`);
    } catch (error: any) {
      toast.error('Erro ao fazer backup: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleExportData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'export_data' }
      });

      if (error) throw error;

      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar dados: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleCleanLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'clean_logs' }
      });

      if (error) throw error;

      toast.success(data.message);
    } catch (error: any) {
      toast.error('Erro ao limpar logs: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleToggle = (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600 mt-1">
          Configure as opções gerais do sistema IFCoins
        </p>
        <p className="text-sm text-green-600 mt-2">
          ✓ Acesso autorizado como administrador
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={localSettings.system_name}
                onChange={(e) => setLocalSettings({...localSettings, system_name: e.target.value})}
                placeholder="Nome do sistema educacional"
              />
            </div>
            <div>
              <Label htmlFor="maxCoins">Máximo de Moedas por Recompensa</Label>
              <Input
                id="maxCoins"
                type="number"
                min="1"
                max="1000"
                value={localSettings.max_coins_per_reward}
                onChange={(e) => setLocalSettings({...localSettings, max_coins_per_reward: e.target.value})}
                placeholder="500"
              />
            </div>
            <div>
              <Label htmlFor="defaultCoins">Moedas Iniciais para Novos Estudantes</Label>
              <Input
                id="defaultCoins"
                type="number"
                min="0"
                max="500"
                value={localSettings.default_student_coins}
                onChange={(e) => setLocalSettings({...localSettings, default_student_coins: e.target.value})}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="dailyLimit">Limite de Recompensas Diárias por Estudante</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="1"
                max="10"
                value={localSettings.max_daily_rewards_per_student}
                onChange={(e) => setLocalSettings({...localSettings, max_daily_rewards_per_student: e.target.value})}
                placeholder="3"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Modo de Manutenção</Label>
                <p className="text-sm text-gray-600">Desabilita o acesso ao sistema</p>
              </div>
              <Button
                variant={localSettings.maintenance_mode === 'true' ? "destructive" : "outline"}
                onClick={() => handleToggle('maintenance_mode', localSettings.maintenance_mode)}
              >
                {localSettings.maintenance_mode === 'true' ? "Ativo" : "Inativo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações e Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações por Email</Label>
                <p className="text-sm text-gray-600">Enviar notificações importantes por email</p>
              </div>
              <Button
                variant={localSettings.email_notifications === 'true' ? "default" : "outline"}
                onClick={() => handleToggle('email_notifications', localSettings.email_notifications)}
              >
                {localSettings.email_notifications === 'true' ? "Ativo" : "Inativo"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Backup Automático</Label>
                <p className="text-sm text-gray-600">Realizar backup diário automático</p>
              </div>
              <Button
                variant={localSettings.auto_backup === 'true' ? "default" : "outline"}
                onClick={() => handleToggle('auto_backup', localSettings.auto_backup)}
              >
                {localSettings.auto_backup === 'true' ? "Ativo" : "Inativo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerenciamento de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBackup} className="w-full flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Fazer Backup Agora
            </Button>
            <Button onClick={handleExportData} variant="outline" className="w-full">
              Exportar Dados do Sistema
            </Button>
            <Button onClick={handleCleanLogs} variant="outline" className="w-full">
              Limpar Logs Antigos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total de Usuários:</span>
                <span className="text-sm font-medium">Dados em tempo real</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cartas no Sistema:</span>
                <span className="text-sm font-medium">Dados em tempo real</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Eventos Ativos:</span>
                <span className="text-sm font-medium">Dados em tempo real</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Último Backup:</span>
                <span className="text-sm font-medium">Nunca</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <DailyCoinsConfig />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={saving}
          className="flex items-center gap-2 bg-ifpr-green hover:bg-ifpr-green-dark"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}