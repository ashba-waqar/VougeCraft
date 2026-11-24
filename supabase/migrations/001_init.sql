-- 001_init.sql: VogueCraft Core Database Schema, RLS Policies, Triggers & Storage

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- 1.1 Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role_title text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 1.2 Sketches table
create table if not exists public.sketches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text check (category in ('western', 'eastern')),
  fabric_label text,
  data jsonb not null default '{}'::jsonb,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 1.3 Boards table
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.4 Board items table
create table if not exists public.board_items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('sketch', 'swatch', 'palette', 'photo', 'snapshot')),
  ref_id uuid,
  payload jsonb not null default '{}'::jsonb,
  x double precision not null default 0,
  y double precision not null default 0,
  rotation double precision not null default 0,
  scale double precision not null default 1.0,
  z_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.5 Palettes table
create table if not exists public.palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  colors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 1.6 Tech packs table
create table if not exists public.tech_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sketch_id uuid not null references public.sketches(id) on delete cascade,
  measurements jsonb not null default '{}'::jsonb,
  fabrics jsonb not null default '[]'::jsonb,
  notes text,
  unit text not null default 'inch' check (unit in ('inch', 'cm')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.7 AI usage tracking table
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('text', 'image')),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

create index if not exists idx_sketches_user_id on public.sketches(user_id);
create index if not exists idx_sketches_updated_at on public.sketches(updated_at desc);
create index if not exists idx_sketches_deleted_at on public.sketches(deleted_at);

create index if not exists idx_boards_user_id on public.boards(user_id);
create index if not exists idx_boards_updated_at on public.boards(updated_at desc);

create index if not exists idx_board_items_board_id on public.board_items(board_id);
create index if not exists idx_board_items_user_id on public.board_items(user_id);
create index if not exists idx_board_items_updated_at on public.board_items(updated_at desc);

create index if not exists idx_palettes_user_id on public.palettes(user_id);
create index if not exists idx_palettes_created_at on public.palettes(created_at desc);

create index if not exists idx_tech_packs_user_id on public.tech_packs(user_id);
create index if not exists idx_tech_packs_sketch_id on public.tech_packs(sketch_id);
create index if not exists idx_tech_packs_updated_at on public.tech_packs(updated_at desc);

create index if not exists idx_ai_usage_user_id on public.ai_usage(user_id);
create index if not exists idx_ai_usage_created_at on public.ai_usage(created_at desc);

-- =============================================================================
-- 3. TRIGGERS & FUNCTIONS
-- =============================================================================

-- 3.1 Updated at timestamp trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Attach updated_at triggers
drop trigger if exists set_sketches_updated_at on public.sketches;
create trigger set_sketches_updated_at
  before update on public.sketches
  for each row execute function public.handle_updated_at();

drop trigger if exists set_boards_updated_at on public.boards;
create trigger set_boards_updated_at
  before update on public.boards
  for each row execute function public.handle_updated_at();

drop trigger if exists set_board_items_updated_at on public.board_items;
create trigger set_board_items_updated_at
  before update on public.board_items
  for each row execute function public.handle_updated_at();

drop trigger if exists set_tech_packs_updated_at on public.tech_packs;
create trigger set_tech_packs_updated_at
  before update on public.tech_packs
  for each row execute function public.handle_updated_at();

-- 3.2 Auto-create profile trigger on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role_title, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role_title', 'Fashion Designer'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- 4.1 Profiles RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 4.2 Sketches RLS
alter table public.sketches enable row level security;

create policy "Users can view own sketches"
  on public.sketches for select
  using (auth.uid() = user_id);

create policy "Users can insert own sketches"
  on public.sketches for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sketches"
  on public.sketches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own sketches"
  on public.sketches for delete
  using (auth.uid() = user_id);

-- 4.3 Boards RLS
alter table public.boards enable row level security;

create policy "Users can view own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- 4.4 Board items RLS (must check user_id and verify board belongs to user)
alter table public.board_items enable row level security;

create policy "Users can view own board items"
  on public.board_items for select
  using (
    auth.uid() = user_id and
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  );

create policy "Users can insert own board items"
  on public.board_items for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  );

create policy "Users can update own board items"
  on public.board_items for update
  using (
    auth.uid() = user_id and
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  );

create policy "Users can delete own board items"
  on public.board_items for delete
  using (
    auth.uid() = user_id and
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  );

-- 4.5 Palettes RLS
alter table public.palettes enable row level security;

create policy "Users can view own palettes"
  on public.palettes for select
  using (auth.uid() = user_id);

create policy "Users can insert own palettes"
  on public.palettes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own palettes"
  on public.palettes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own palettes"
  on public.palettes for delete
  using (auth.uid() = user_id);

-- 4.6 Tech packs RLS
alter table public.tech_packs enable row level security;

create policy "Users can view own tech packs"
  on public.tech_packs for select
  using (auth.uid() = user_id);

create policy "Users can insert own tech packs"
  on public.tech_packs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tech packs"
  on public.tech_packs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tech packs"
  on public.tech_packs for delete
  using (auth.uid() = user_id);

-- 4.7 AI usage RLS (users can insert and select own rows only)
alter table public.ai_usage enable row level security;

create policy "Users can view own ai usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai usage"
  on public.ai_usage for insert
  with check (auth.uid() = user_id);

-- =============================================================================
-- 5. STORAGE BUCKETS & POLICIES
-- =============================================================================

-- 5.1 Create private storage buckets
insert into storage.buckets (id, name, public)
values
  ('sketch-thumbnails', 'sketch-thumbnails', false),
  ('board-photos', 'board-photos', false),
  ('ai-motifs', 'ai-motifs', false),
  ('exports', 'exports', false)
on conflict (id) do nothing;

-- 5.2 Storage RLS policies (folder path prefix must match auth.uid())
-- Path format: bucket_id/{user_id}/...

create policy "Users can read own storage files"
  on storage.objects for select
  using (
    bucket_id in ('sketch-thumbnails', 'board-photos', 'ai-motifs', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own storage files"
  on storage.objects for insert
  with check (
    bucket_id in ('sketch-thumbnails', 'board-photos', 'ai-motifs', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own storage files"
  on storage.objects for update
  using (
    bucket_id in ('sketch-thumbnails', 'board-photos', 'ai-motifs', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('sketch-thumbnails', 'board-photos', 'ai-motifs', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own storage files"
  on storage.objects for delete
  using (
    bucket_id in ('sketch-thumbnails', 'board-photos', 'ai-motifs', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
