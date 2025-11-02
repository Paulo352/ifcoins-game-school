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
      console.log('🔄 Buscando todas as configurações do admin...');
      const { data, error } = await supabase
        .from('admin_config')
        .select('config_key, config_value');

      if (error) throw error;

      console.log('✅ Configurações carregadas:', data);

      const configObject = data.reduce((acc, item) => {
        acc[item.config_key] = item.config_value;
        return acc;
      }, {} as AdminConfig);

      setConfig(configObject);
      console.log('✅ Config object final:', configObject);
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações administrativas');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      // Primeiro, verificar se já existe
      const { data: existing } = await supabase
        .from('admin_config')
        .select('id')
        .eq('config_key', key)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('admin_config')
          .update({ 
            config_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('config_key', key);

        if (error) throw error;
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('admin_config')
          .insert({ 
            config_key: key, 
            config_value: value,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

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

    // Configurar realtime subscription para sincronizar mudanças
    const channel = supabase
      .channel('admin_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_config'
        },
        (payload) => {
          console.log('Config change detected:', payload);
          // Recarregar configurações quando houver mudanças
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    config,
    loading,
    updateConfig,
    getConfig,
    refreshConfig: fetchConfig
  };
};