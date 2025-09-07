-- Resetar todas as cartas dos usuários
DELETE FROM public.user_cards;

-- Resetar todas as moedas dos usuários
UPDATE public.profiles SET coins = 0;

-- Limpar logs de recompensas
DELETE FROM public.reward_logs;

-- Limpar todas as cartas existentes (dados genéricos)
DELETE FROM public.cards;

-- Limpar todos os eventos (dados genéricos) 
DELETE FROM public.events;

-- Limpar todas as votações (dados genéricos)
DELETE FROM public.poll_votes;
DELETE FROM public.poll_options;
DELETE FROM public.polls;

-- Limpar todas as trocas
DELETE FROM public.trades;

-- Inserir configurações administrativas reais
INSERT INTO public.admin_config (config_key, config_value) VALUES 
('default_admin_email', 'admin@ifpr.edu.br'),
('max_coins_per_reward', '500'),
('default_student_coins', '100'),
('system_name', 'IFCoins - Sistema Educacional Gamificado'),
('max_daily_rewards_per_student', '3')
ON CONFLICT (config_key) DO UPDATE SET 
config_value = EXCLUDED.config_value,
updated_at = now();