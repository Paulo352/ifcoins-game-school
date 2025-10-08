import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { Wrench, AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MaintenanceControl() {
  const { status, toggleMaintenanceMode, scheduleMaintenanceNotification } = useMaintenanceMode();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleMaintenance = async () => {
    setIsSubmitting(true);
    try {
      const maintenanceMessage = message || 'Sistema em manutenção. Tente novamente mais tarde.';
      await toggleMaintenanceMode(!status.enabled, maintenanceMessage);
      
      toast({
        title: status.enabled ? 'Modo manutenção desativado' : 'Modo manutenção ativado',
        description: status.enabled 
          ? 'Usuários podem fazer login novamente.' 
          : 'Apenas administradores podem fazer login agora.',
      });
      
      setMessage('');
    } catch (error) {
      console.error('Erro ao alterar modo manutenção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar modo manutenção.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!scheduledDate || !message) {
      toast({
        title: 'Erro',
        description: 'Preencha a data e mensagem para agendar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await scheduleMaintenanceNotification(scheduledDate, message);
      
      toast({
        title: 'Manutenção agendada',
        description: 'Notificação de manutenção foi agendada com sucesso.',
      });
      
      setScheduledDate('');
      setMessage('');
    } catch (error) {
      console.error('Erro ao agendar manutenção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao agendar manutenção.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Controle de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Controle de Manutenção
          <Badge variant="secondary" className="ml-auto text-xs">
            em manutenção
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status atual */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${status.enabled ? 'bg-warning' : 'bg-green-500'}`} />
            <div>
              <p className="font-medium">
                {status.enabled ? 'Manutenção Ativa' : 'Sistema Normal'}
              </p>
              <p className="text-sm text-muted-foreground">
                {status.enabled 
                  ? 'Apenas administradores podem fazer login' 
                  : 'Todos os usuários podem fazer login'
                }
              </p>
            </div>
          </div>
          {status.enabled && (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
        </div>

        {/* Controle de ativação/desativação */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance-mode"
              checked={status.enabled}
              onCheckedChange={handleToggleMaintenance}
              disabled={isSubmitting}
            />
            <Label htmlFor="maintenance-mode">
              {status.enabled ? 'Desativar' : 'Ativar'} modo manutenção
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Mensagem de manutenção</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Digite a mensagem que será exibida durante a manutenção..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {!status.enabled && (
            <Button
              onClick={handleToggleMaintenance}
              disabled={isSubmitting}
              className="w-full"
              variant="outline"
            >
              {isSubmitting ? 'Ativando...' : 'Ativar Modo Manutenção'}
            </Button>
          )}
        </div>

        {/* Agendamento de manutenção */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label className="font-medium">Agendar Notificação de Manutenção</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Data e hora da manutenção</Label>
            <Input
              id="scheduled-date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handleScheduleMaintenance}
            disabled={isSubmitting || !scheduledDate || !message}
            className="w-full"
            variant="secondary"
          >
            {isSubmitting ? 'Agendando...' : 'Agendar Notificação'}
          </Button>
        </div>

        {/* Mensagem atual */}
        {status.enabled && status.message && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-sm font-medium text-warning">Mensagem atual:</p>
            <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}