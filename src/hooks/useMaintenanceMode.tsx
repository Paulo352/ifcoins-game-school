import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  scheduled_at?: string;
  loading: boolean;
}

export const useMaintenanceMode = () => {
  const [status, setStatus] = useState<MaintenanceStatus>({
    enabled: false,
    message: '',
    loading: true
  });
  const { profile } = useAuth();

  const checkMaintenanceMode = async () => {
    try {
      const { data } = await supabase
        .from('admin_config')
        .select('config_key, config_value')
        .in('config_key', ['maintenance_mode', 'maintenance_message', 'maintenance_scheduled_at']);

      const config = data?.reduce((acc, item) => {
        acc[item.config_key] = item.config_value;
        return acc;
      }, {} as Record<string, string>) || {};

      setStatus({
        enabled: config.maintenance_mode === 'true',
        message: config.maintenance_message || 'Sistema em manutenção. Tente novamente mais tarde.',
        scheduled_at: config.maintenance_scheduled_at,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao verificar modo manutenção:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleMaintenanceMode = async (enabled: boolean, message?: string) => {
    if (profile?.role !== 'admin') {
      throw new Error('Apenas administradores podem alterar o modo manutenção');
    }

    try {
      await supabase.functions.invoke('admin-tools', {
        body: { 
          action: 'maintenance_mode', 
          enabled,
          message: message || 'Sistema em manutenção. Tente novamente mais tarde.'
        }
      });
      
      await checkMaintenanceMode();
    } catch (error) {
      console.error('Erro ao alterar modo manutenção:', error);
      throw error;
    }
  };

  const scheduleMaintenanceNotification = async (scheduledAt: string, message: string) => {
    if (profile?.role !== 'admin') {
      throw new Error('Apenas administradores podem agendar manutenção');
    }

    try {
      await supabase.functions.invoke('admin-tools', {
        body: { 
          action: 'schedule_maintenance',
          scheduled_at: scheduledAt,
          message
        }
      });
      await checkMaintenanceMode();
    } catch (error) {
      console.error('Erro ao agendar manutenção:', error);
      throw error;
    }
  };

  const cancelScheduledMaintenance = async () => {
    if (profile?.role !== 'admin') {
      throw new Error('Apenas administradores podem cancelar agendamento');
    }
    try {
      await supabase.functions.invoke('admin-tools', {
        body: { action: 'cancel_scheduled_maintenance' }
      });
      await checkMaintenanceMode();
    } catch (error) {
      console.error('Erro ao cancelar agendamento de manutenção:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkMaintenanceMode();
    
    // Verificar a cada 30 segundos se o modo manutenção mudou
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    toggleMaintenanceMode,
    scheduleMaintenanceNotification,
    cancelScheduledMaintenance,
    refreshStatus: checkMaintenanceMode
  };
};