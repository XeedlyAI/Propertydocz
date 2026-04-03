-- Add signature_image_url column to tenants table
-- Stores the Supabase Storage path for the tenant's uploaded signature image
alter table tenants add column if not exists signature_image_url text;

-- Create storage bucket for signatures (if not exists)
-- Note: Run this in Supabase dashboard if INSERT INTO storage.buckets fails
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload/read their tenant's signatures
create policy "Tenant admins can upload signatures"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'signatures');

create policy "Tenant admins can read signatures"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'signatures');

create policy "Tenant admins can delete signatures"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'signatures');

create policy "Service role full access to signatures"
  on storage.objects for all
  to service_role
  using (bucket_id = 'signatures');
