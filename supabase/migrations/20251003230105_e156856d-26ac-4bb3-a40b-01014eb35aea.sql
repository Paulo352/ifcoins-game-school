-- Inserir configuração padrão do limite diário de professores caso não exista
INSERT INTO public.admin_config (config_key, config_value)
VALUES ('teacher_daily_limit', '500')
ON CONFLICT (config_key) DO NOTHING;