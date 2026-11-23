-- Kley Prompt cloud content store.
-- Run this once in Supabase SQL Editor.
create table if not exists public.kley_site_content (
  id text primary key check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kley_site_content enable row level security;
-- No anon/authenticated table policies: all access goes through the Vercel API
-- using the server-only Supabase service role key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kley-public-assets','kley-public-assets',true,6291456,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public=true, file_size_limit=6291456,
  allowed_mime_types=excluded.allowed_mime_types;

-- Public read access to images is provided by the public bucket setting.
-- Uploads are performed only by the Vercel API using the service role key.
