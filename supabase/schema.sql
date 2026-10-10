create table if not exists public.lyric_sheets (
  song_id text primary key,
  sections jsonb not null default '[]'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint lyric_sheets_sections_is_array
    check (jsonb_typeof(sections) = 'array')
);

alter table public.lyric_sheets
  add column if not exists revision bigint not null default 1;

alter table public.lyric_sheets enable row level security;

grant select on public.lyric_sheets to anon, authenticated;
grant insert, update on public.lyric_sheets to authenticated;

drop policy if exists "Anyone can read lyric sheets"
  on public.lyric_sheets;
create policy "Anyone can read lyric sheets"
  on public.lyric_sheets for select
  to anon, authenticated
  using (true);

drop policy if exists "Editors can add lyric sheets"
  on public.lyric_sheets;
create policy "Editors can add lyric sheets"
  on public.lyric_sheets for insert
  to authenticated
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'editor'
    and updated_by = auth.uid()
  );

drop policy if exists "Editors can update lyric sheets"
  on public.lyric_sheets;
create policy "Editors can update lyric sheets"
  on public.lyric_sheets for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'editor')
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'editor'
    and updated_by = auth.uid()
  );

create table if not exists public.songs (
  song_id text primary key,
  song jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint songs_id_matches_data
    check (song->>'id' = song_id),
  constraint songs_data_is_object
    check (jsonb_typeof(song) = 'object')
);

alter table public.songs enable row level security;

grant select on public.songs to anon, authenticated;
grant insert, update on public.songs to authenticated;

drop policy if exists "Anyone can read songs" on public.songs;
create policy "Anyone can read songs"
  on public.songs for select
  to anon, authenticated
  using (true);

drop policy if exists "Editors can add songs" on public.songs;
create policy "Editors can add songs"
  on public.songs for insert
  to authenticated
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'editor'
    and updated_by = auth.uid()
  );

drop policy if exists "Editors can update songs" on public.songs;
create policy "Editors can update songs"
  on public.songs for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'editor')
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'editor'
    and updated_by = auth.uid()
  );

create table if not exists public.setlists (
  set_id text primary key,
  name text not null,
  kind text not null check (kind in ('performance', 'catalog')),
  song_ids jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint setlists_song_ids_is_array
    check (jsonb_typeof(song_ids) = 'array')
);

alter table public.setlists enable row level security;

grant select on public.setlists to anon, authenticated;
grant insert, update on public.setlists to authenticated;

drop policy if exists "Anyone can read setlists" on public.setlists;
create policy "Anyone can read setlists"
  on public.setlists for select
  to anon, authenticated
  using (true);

drop policy if exists "Editors can add setlists" on public.setlists;
create policy "Editors can add setlists"
  on public.setlists for insert
  to authenticated
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'editor'
    and updated_by = auth.uid()
  );

drop policy if exists "Editors can update setlists" on public.setlists;
create policy "Editors can update setlists"
  on public.setlists for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'editor')
  with check (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'editor'
    and updated_by = auth.uid()
  );
