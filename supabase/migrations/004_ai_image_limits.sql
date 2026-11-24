-- 004_ai_image_limits.sql: Motif storage table, RLS, and usage limits

-- 1. Create motifs table for saving and retrieving generated motif history
create table if not exists public.motifs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  style text not null,
  storage_path text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Index for fast user history queries
create index if not exists idx_motifs_user_id_created_at
  on public.motifs (user_id, created_at desc);

-- 2. Enable RLS on motifs
alter table public.motifs enable row level security;

create policy "Users can view own motifs"
  on public.motifs for select
  using (auth.uid() = user_id);

create policy "Users can insert own motifs"
  on public.motifs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own motifs"
  on public.motifs for delete
  using (auth.uid() = user_id);

-- 3. Confirm ai-motifs bucket existence and private configuration
insert into storage.buckets (id, name, public)
values ('ai-motifs', 'ai-motifs', false)
on conflict (id) do update set public = false;

-- 4. Composite index on ai_usage for fast image quota evaluation
create index if not exists idx_ai_usage_user_kind_image
  on public.ai_usage (user_id, kind, created_at desc)
  where kind = 'image';
