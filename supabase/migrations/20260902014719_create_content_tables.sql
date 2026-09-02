create table public.images (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.texts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author text not null,
  sent_at timestamptz not null,
  context text,
  source text,
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  spotify_url text not null,
  created_at timestamptz not null default now()
);

alter table public.images enable row level security;
alter table public.texts enable row level security;
alter table public.videos enable row level security;
alter table public.songs enable row level security;

revoke all on table public.images, public.texts, public.videos, public.songs
from anon, authenticated;

grant select on table public.images, public.texts, public.videos, public.songs
to anon;

create policy "anon can read images"
on public.images
for select
to anon
using (true);

create policy "anon can read texts"
on public.texts
for select
to anon
using (true);

create policy "anon can read videos"
on public.videos
for select
to anon
using (true);

create policy "anon can read songs"
on public.songs
for select
to anon
using (true);
