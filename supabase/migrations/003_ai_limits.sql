-- 003_ai_limits.sql: Indexes and functions for AI usage rate limiting

-- 1. Composite index on ai_usage for fast daily usage checks per user and timestamp
create index if not exists idx_ai_usage_user_id_created_at
  on public.ai_usage (user_id, created_at desc);

-- 2. Helper function to count today's usage (UTC) for a given user and kind
create or replace function public.get_daily_ai_usage(
  p_user_id uuid,
  p_kind text default 'text'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_count integer;
begin
  select count(*)::integer
  into usage_count
  from public.ai_usage
  where user_id = p_user_id
    and kind = p_kind
    and created_at >= date_trunc('day', timezone('utc', now()));

  return coalesce(usage_count, 0);
end;
$$;

-- Grant execution to authenticated, anon and service_role
grant execute on function public.get_daily_ai_usage(uuid, text) to authenticated, anon, service_role;

-- 3. View to aggregate daily AI usage across kinds
create or replace view public.ai_usage_today as
select
  user_id,
  kind,
  count(*)::integer as usage_count,
  min(created_at) as first_request_at,
  max(created_at) as last_request_at
from public.ai_usage
where created_at >= date_trunc('day', timezone('utc', now()))
group by user_id, kind;
