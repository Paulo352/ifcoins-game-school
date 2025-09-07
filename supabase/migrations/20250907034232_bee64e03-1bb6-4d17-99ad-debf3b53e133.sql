-- Adicionar configurações para distribuição automática de moedas diárias
INSERT INTO public.admin_config (config_key, config_value) VALUES
('daily_coins_enabled', 'false'),
('daily_coins_amount', '10'),
('daily_coins_days', 'all'),
('daily_coins_interval', '1'),
('daily_coins_last_distribution', ''),
('daily_coins_target_roles', 'student')
ON CONFLICT (config_key) DO NOTHING;