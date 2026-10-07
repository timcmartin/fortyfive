create table if not exists public.lyric_sheets (
  song_id text primary key,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint lyric_sheets_sections_is_array
    check (jsonb_typeof(sections) = 'array')
);

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
