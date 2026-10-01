-- Babydoll — acervo de memórias (estrutura mínima). Espelha src/services/supabase/types.ts.
-- RLS/grants remotos não são inferíveis pelo código e não foram inventados.
create table if not exists public.images (id uuid primary key default gen_random_uuid(), name text not null, storage_path text not null, description text, created_at timestamptz not null default now());
create table if not exists public.texts (id uuid primary key default gen_random_uuid(), content text not null, author text not null, sent_at timestamptz not null, context text, source text, created_at timestamptz not null default now());
create table if not exists public.videos (id uuid primary key default gen_random_uuid(), name text not null, storage_path text not null, description text, created_at timestamptz not null default now());
create table if not exists public.songs (id uuid primary key default gen_random_uuid(), name text not null, spotify_url text not null, created_at timestamptz not null default now());
