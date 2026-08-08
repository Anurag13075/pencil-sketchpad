-- pgvector for semantic diagram search
create extension if not exists vector with schema extensions;

-- BOARDS -------------------------------------------------------------
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique default encode(gen_random_bytes(6), 'hex'),
  title text not null default 'Untitled board',
  elements jsonb not null default '[]'::jsonb,
  app_state jsonb not null default '{}'::jsonb,
  owner_key text,
  is_public boolean not null default true,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index boards_updated_at_idx on public.boards (updated_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO authenticated;
GRANT ALL ON public.boards TO service_role;
alter table public.boards enable row level security;
create policy "Public boards are readable" on public.boards for select using (is_public = true);
create policy "Anyone can create a board" on public.boards for insert with check (true);
create policy "Anyone can update a public board" on public.boards for update using (is_public = true) with check (is_public = true);
create policy "Anyone can delete a public board" on public.boards for delete using (is_public = true);

-- SNAPSHOTS (version history) ---------------------------------------
create table public.board_snapshots (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  label text not null default 'Autosave',
  elements jsonb not null default '[]'::jsonb,
  element_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index board_snapshots_board_idx on public.board_snapshots (board_id, created_at desc);

GRANT SELECT, INSERT, DELETE ON public.board_snapshots TO anon;
GRANT SELECT, INSERT, DELETE ON public.board_snapshots TO authenticated;
GRANT ALL ON public.board_snapshots TO service_role;
alter table public.board_snapshots enable row level security;
create policy "Snapshots readable" on public.board_snapshots for select using (true);
create policy "Snapshots insertable" on public.board_snapshots for insert with check (true);
create policy "Snapshots deletable" on public.board_snapshots for delete using (true);

-- EMBEDDINGS (semantic search over boards) --------------------------
create table public.board_embeddings (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  content text not null,
  summary text,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);
create unique index board_embeddings_board_idx on public.board_embeddings (board_id);

GRANT SELECT ON public.board_embeddings TO anon;
GRANT SELECT ON public.board_embeddings TO authenticated;
GRANT ALL ON public.board_embeddings TO service_role;
alter table public.board_embeddings enable row level security;
create policy "Embeddings readable" on public.board_embeddings for select using (true);

-- semantic search function
create or replace function public.match_boards(query_embedding extensions.vector(1536), match_count int default 8)
returns table (board_id uuid, slug text, title text, summary text, similarity float)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select b.id, b.slug, b.title, e.summary,
         1 - (e.embedding <=> query_embedding) as similarity
  from public.board_embeddings e
  join public.boards b on b.id = e.board_id
  where e.embedding is not null
  order by e.embedding <=> query_embedding
  limit match_count
$$;

grant execute on function public.match_boards(extensions.vector(1536), int) to anon, authenticated, service_role;

-- updated_at triggers
create trigger update_boards_updated_at before update on public.boards
for each row execute function public.update_updated_at_column();

-- realtime multiplayer
alter table public.boards replica identity full;
alter publication supabase_realtime add table public.boards;