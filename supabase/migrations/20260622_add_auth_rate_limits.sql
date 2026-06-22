-- Distributed fixed-window rate limiting for public authentication actions.

create table if not exists public.auth_rate_limits (
  bucket_hash text not null check (bucket_hash ~ '^[0-9a-f]{64}$'),
  action text not null check (action in ('login', 'register')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (bucket_hash, action)
);

alter table public.auth_rate_limits enable row level security;

revoke all on table public.auth_rate_limits from anon, authenticated;

create or replace function public.consume_auth_rate_limit(
  p_action text,
  p_bucket_hash text
)
returns table (is_allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_limit integer;
  v_count integer;
  v_started_at timestamptz;
begin
  if p_bucket_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit bucket';
  end if;

  case p_action
    when 'login' then
      v_window := interval '15 minutes';
      v_limit := 5;
    when 'register' then
      v_window := interval '60 minutes';
      v_limit := 3;
    else
      raise exception 'Invalid rate-limit action';
  end case;

  insert into public.auth_rate_limits as limits (
    bucket_hash,
    action,
    window_started_at,
    request_count
  )
  values (p_bucket_hash, p_action, v_now, 1)
  on conflict (bucket_hash, action) do update
  set
    request_count = case
      when limits.window_started_at <= v_now - v_window then 1
      else limits.request_count + 1
    end,
    window_started_at = case
      when limits.window_started_at <= v_now - v_window then v_now
      else limits.window_started_at
    end
  returning request_count, window_started_at
  into v_count, v_started_at;

  delete from public.auth_rate_limits
  where ctid in (
    select ctid
    from public.auth_rate_limits
    where window_started_at < v_now - interval '24 hours'
    order by window_started_at
    limit 50
  );

  is_allowed := v_count <= v_limit;
  retry_after_seconds := case
    when is_allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (v_started_at + v_window - v_now)))::integer
    )
  end;

  return next;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, text) from public;
grant execute on function public.consume_auth_rate_limit(text, text) to anon, authenticated;
