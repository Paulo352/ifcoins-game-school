import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserSettings } from '@/components/settings/UserSettings';
import { SelectiveResetButton } from '@/components/admin/SelectiveResetButton';
import { MaintenanceControl } from '@/components/admin/MaintenanceControl';
import { TeacherDailyLimitConfig } from '@/components/admin/TeacherDailyLimitConfig';
import { DailyCoinsConfig } from '@/components/admin/DailyCoinsConfig';
import { 
  Database, 
  Download, 
  Trash2, 
  Loader2,
  Settings as SettingsIcon,
  Mail,
  User,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Settings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
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

        <TabsContent value="admin" className="space-y-6">
          {/* Controle de Manutenção */}
          <MaintenanceControl />

          {/* Configurações de Moedas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeacherDailyLimitConfig />
            <DailyCoinsConfig />
          </div>

          {/* Outras Configurações Administrativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Backup do Banco de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup do Banco
                  <Badge variant="secondary" className="ml-auto text-xs">
                    em manutenção
                  </Badge>
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
                  <Badge variant="secondary" className="ml-auto text-xs">
                    em manutenção
                  </Badge>
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
                  <Badge variant="secondary" className="ml-auto text-xs">
                    em manutenção
                  </Badge>
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

            {/* Pacote de Cartas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pacote de Cartas
                  <Badge variant="secondary" className="ml-auto text-xs">
                    em breve
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gerencie pacotes de cartas especiais e promoções para estudantes.
                </p>
                <Button 
                  disabled
                  variant="outline"
                  className="w-full"
                >
                  Configurar Pacotes
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

          {/* Zona de Perigo - Reset Seletivo */}
          <SelectiveResetButton />
        </TabsContent>

        <TabsContent value="user">
          <UserSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}