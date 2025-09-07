-- Criar bucket de backups e políticas
insert into storage.buckets (id, name, public) values ('backups', 'backups', false)
on conflict (id) do nothing;

-- Políticas para permitir que admins visualizem objetos do bucket 'backups'
create policy if not exists "Admins can view backups"
on storage.objects for select
using (
  bucket_id = 'backups' and get_current_user_role() = 'admin'
);

-- Permitir admins listar objetos
create policy if not exists "Admins can list backups"
on storage.objects for select
using (
  bucket_id = 'backups' and get_current_user_role() = 'admin'
);

-- Permitir admins deletarem objetos (opcional)
create policy if not exists "Admins can delete backups"
on storage.objects for delete
using (
  bucket_id = 'backups' and get_current_user_role() = 'admin'
);

-- Não criamos políticas de INSERT pois o Edge Function usará service role (bypassa RLS)
