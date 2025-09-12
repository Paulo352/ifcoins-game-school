import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserSettings } from '@/components/settings/UserSettings';
import { 
  Database, 
  Download, 
  Trash2, 
  Loader2,
  Shield,
  AlertTriangle,
  Settings as SettingsIcon,
  Power,
  Calendar,
  Mail,
  User
} from 'lucide-react';

export function Settings() {
  const { profile } = useAuth();
  const { status: maintenanceStatus, toggleMaintenanceMode, scheduleMaintenanceNotification, cancelScheduledMaintenance } = useMaintenanceMode();
  const [loading, setLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [scheduledMaintenanceData, setScheduledMaintenanceData] = useState({
    date: '',
    time: '',
    message: ''
  });
  const [testEmail, setTestEmail] = useState('');

  const handleBackup = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'backup_database' }
      });

      if (error) throw error;

      toast.success(`Backup realizado com sucesso! Arquivo: ${data.fileName}`);
    } catch (error: any) {
      console.error('Erro ao fazer backup:', error);
      toast.error('Erro ao fazer backup: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'export_data' }
      });

      if (error) throw error;

      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'cleanup_logs' }
      });

      if (error) throw error;

      toast.success(data.message || 'Logs limpos com sucesso');
    } catch (error: any) {
      console.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceMessage.trim()) {
      toast.error('Digite uma mensagem de manutenção');
      return;
    }

    try {
      setLoading(true);
      await toggleMaintenanceMode(!maintenanceStatus.enabled, maintenanceMessage);
      toast.success(`Modo manutenção ${!maintenanceStatus.enabled ? 'ativado' : 'desativado'} com sucesso`);
      setMaintenanceMessage('');
    } catch (error) {
      console.error('Erro ao alterar modo manutenção:', error);
      toast.error('Erro ao alterar modo manutenção');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!scheduledMaintenanceData.date || !scheduledMaintenanceData.time || !scheduledMaintenanceData.message) {
      toast.error('Preencha todos os campos para agendar manutenção');
      return;
    }

    try {
      setLoading(true);
      const scheduledAt = new Date(`${scheduledMaintenanceData.date}T${scheduledMaintenanceData.time}`).toISOString();
      await scheduleMaintenanceNotification(scheduledAt, scheduledMaintenanceData.message);
      toast.success('Notificação de manutenção agendada com sucesso');
      setScheduledMaintenanceData({ date: '', time: '', message: '' });
    } catch (error) {
      console.error('Erro ao agendar manutenção:', error);
      toast.error('Erro ao agendar manutenção');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      setLoading(true);
      await cancelScheduledMaintenance();
      toast.success('Agendamento cancelado com sucesso');
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'send_test_email', to_email: testEmail }
      });

      if (error) throw error;

      toast.success(data?.message || 'Email de teste enviado. Verifique sua caixa de entrada.');
      setTestEmail('');
    } catch (error: any) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };
 
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar as configurações do sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie configurações administrativas e pessoais do sistema
        </p>
      </div>

      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
          <TabsTrigger value="admin" className="flex items-center gap-2 text-sm">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações </span>Administrativas
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações </span>Pessoais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-6">{/* Conteúdo administrativo */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Modo Manutenção */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Power className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Modo Manutenção</span>
              {maintenanceStatus.enabled && (
                <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs">
                  ATIVO
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {maintenanceStatus.enabled 
                ? 'Sistema atualmente em modo manutenção. Usuários não conseguem fazer login.'
                : 'Ativar modo manutenção impede login de estudantes e professores.'
              }
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
              <Textarea
                id="maintenance-message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder={maintenanceStatus.message || "Digite a mensagem que será exibida durante a manutenção..."}
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleToggleMaintenance}
              disabled={loading || maintenanceStatus.loading}
              variant={maintenanceStatus.enabled ? "destructive" : "default"}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {maintenanceStatus.enabled ? 'Desativar' : 'Ativar'} Modo Manutenção
            </Button>
          </CardContent>
        </Card>

        {/* Agendar Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendar Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Notificar usuários sobre manutenção programada.
            </p>

            {maintenanceStatus.scheduled_at ? (
              <div className="rounded-md border p-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Agendamento atual: </span>
                  {new Date(maintenanceStatus.scheduled_at).toLocaleString('pt-BR')}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  onClick={handleCancelSchedule}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancelar agendamento
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum agendamento ativo.</p>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Agendar Notificação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agendar Notificação de Manutenção</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-date">Data</Label>
                      <Input
                        id="maintenance-date"
                        type="date"
                        value={scheduledMaintenanceData.date}
                        onChange={(e) => setScheduledMaintenanceData(prev => ({
                          ...prev,
                          date: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-time">Hora</Label>
                      <Input
                        id="maintenance-time"
                        type="time"
                        value={scheduledMaintenanceData.time}
                        onChange={(e) => setScheduledMaintenanceData(prev => ({
                          ...prev,
                          time: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-message">Mensagem</Label>
                    <Textarea
                      id="scheduled-message"
                      value={scheduledMaintenanceData.message}
                      onChange={(e) => setScheduledMaintenanceData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      placeholder="Mensagem sobre a manutenção agendada..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleScheduleMaintenance}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Notificações
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Backup do Banco de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup do Banco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Criar backup completo do banco de dados do sistema.
            </p>
            <Button 
              onClick={handleBackup} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Backup
            </Button>
          </CardContent>
        </Card>

        {/* Exportar Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exportar dados do sistema em formato JSON para análise.
            </p>
            <Button 
              onClick={handleExportData} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Exportar Dados
            </Button>
          </CardContent>
        </Card>

        {/* Teste de Envio de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Teste de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um email de teste para verificar a configuração do serviço de email.
            </p>
            <div className="space-y-2">
              <Label htmlFor="test-email">Email de destino</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu.email@ifpr.edu.br"
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleSendTestEmail} 
              disabled={loading || !testEmail}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Email de Teste
            </Button>
          </CardContent>
        </Card>

        {/* Limpar Logs Antigos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Limpar Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remove logs de sistema com mais de 30 dias para otimizar performance.
            </p>
            <Button 
              onClick={handleCleanupLogs} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Limpar Logs Antigos
            </Button>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="user">
          <UserSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}