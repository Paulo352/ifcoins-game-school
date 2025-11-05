-- Configurar cron jobs para edge functions

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para processar pagamentos automáticos de empréstimos (toda segunda-feira às 9h)
SELECT cron.schedule(
  'process-weekly-loan-payments',
  '0 9 * * 1',
  $$
  SELECT
    net.http_post(
        url:='https://bcopgknrpjenixejhlfz.supabase.co/functions/v1/process-loan-payments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb3Bna25ycGplbml4ZWpobGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDY2MTgsImV4cCI6MjA2NDIyMjYxOH0.eBOejieDJaIwD89FZPJYDzr4Vx9f8ad6KxSFDbO85bI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Criar cron job para distribuir moedas diárias (todo dia às 8h)
SELECT cron.schedule(
  'distribute-daily-coins',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://bcopgknrpjenixejhlfz.supabase.co/functions/v1/distribute-daily-coins',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb3Bna25ycGplbml4ZWpobGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDY2MTgsImV4cCI6MjA2NDIyMjYxOH0.eBOejieDJaIwD89FZPJYDzr4Vx9f8ad6KxSFDbO85bI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);