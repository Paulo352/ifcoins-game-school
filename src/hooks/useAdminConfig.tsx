import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminConfig {
  [key: string]: string;
}

export const useAdminConfig = () => {
  const [config, setConfig] = useState<AdminConfig>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('config_key, config_value');

      if (error) throw error;

      const configObject = data.reduce((acc, item) => {
        acc[item.config_key] = item.config_value;
        return acc;
      }, {} as AdminConfig);

      setConfig(configObject);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações administrativas');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('admin_config')
        .upsert({ 
          config_key: key, 
          config_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        });

      if (error) throw error;

      setConfig(prev => ({ ...prev, [key]: value }));
      toast.success('Configuração atualizada com sucesso');
      await fetchConfig(); // Atualizar o config após salvar
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const getConfig = (key: string, defaultValue: string = '') => {
    return config[key] || defaultValue;
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    updateConfig,
    getConfig,
    refreshConfig: fetchConfig
  };
};