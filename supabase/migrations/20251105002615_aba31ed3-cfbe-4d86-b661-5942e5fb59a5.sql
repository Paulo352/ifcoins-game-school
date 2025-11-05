-- Adicionar cron job para enviar notificações de empréstimos (todo dia às 18h)
SELECT cron.schedule(
  'send-loan-notifications',
  '0 18 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://bcopgknrpjenixejhlfz.supabase.co/functions/v1/send-loan-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb3Bna25ycGplbml4ZWpobGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDY2MTgsImV4cCI6MjA2NDIyMjYxOH0.eBOejieDJaIwD89FZPJYDzr4Vx9f8ad6KxSFDbO85bI"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);