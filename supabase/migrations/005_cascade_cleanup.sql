-- 005_cascade_cleanup.sql: Enforce ON DELETE CASCADE for all user-owned tables

do $$
declare
  t record;
  c record;
begin
  -- Ensure profiles table has cascade delete on primary key
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    alter table public.profiles drop constraint if exists profiles_id_fkey;
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;

  -- Ensure sketches table has cascade delete on user_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'sketches'
  ) then
    alter table public.sketches drop constraint if exists sketches_user_id_fkey;
    alter table public.sketches
      add constraint sketches_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  -- Ensure boards table has cascade delete on user_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'boards'
  ) then
    alter table public.boards drop constraint if exists boards_user_id_fkey;
    alter table public.boards
      add constraint boards_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  -- Ensure board_items table has cascade delete on user_id and board_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'board_items'
  ) then
    alter table public.board_items drop constraint if exists board_items_user_id_fkey;
    alter table public.board_items
      add constraint board_items_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;

    alter table public.board_items drop constraint if exists board_items_board_id_fkey;
    alter table public.board_items
      add constraint board_items_board_id_fkey
      foreign key (board_id) references public.boards(id) on delete cascade;
  end if;

  -- Ensure palettes table has cascade delete on user_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'palettes'
  ) then
    alter table public.palettes drop constraint if exists palettes_user_id_fkey;
    alter table public.palettes
      add constraint palettes_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  -- Ensure tech_packs table has cascade delete on user_id and sketch_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'tech_packs'
  ) then
    alter table public.tech_packs drop constraint if exists tech_packs_user_id_fkey;
    alter table public.tech_packs
      add constraint tech_packs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;

    alter table public.tech_packs drop constraint if exists tech_packs_sketch_id_fkey;
    alter table public.tech_packs
      add constraint tech_packs_sketch_id_fkey
      foreign key (sketch_id) references public.sketches(id) on delete cascade;
  end if;

  -- Ensure ai_usage table has cascade delete on user_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'ai_usage'
  ) then
    alter table public.ai_usage drop constraint if exists ai_usage_user_id_fkey;
    alter table public.ai_usage
      add constraint ai_usage_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  -- Ensure motifs table has cascade delete on user_id
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'motifs'
  ) then
    alter table public.motifs drop constraint if exists motifs_user_id_fkey;
    alter table public.motifs
      add constraint motifs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;
