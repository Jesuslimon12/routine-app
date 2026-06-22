-- Mi Rutina Diaria — canonical Supabase schema
-- Run in a new Supabase project. Existing projects should run migrations/.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_rate_limits (
  bucket_hash text not null check (bucket_hash ~ '^[0-9a-f]{64}$'),
  action text not null check (action in ('login', 'register')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (bucket_hash, action)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  schedule_type text not null default 'daily',
  start_date date not null default ((now() at time zone 'America/Mexico_City')::date),
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint activities_id_user_unique unique (id, user_id),
  constraint activities_schedule_valid check (
    (schedule_type = 'daily' and end_date is null)
    or (schedule_type = 'single' and end_date = start_date)
    or (schedule_type = 'range' and end_date >= start_date)
  )
);

create table if not exists public.activity_pauses (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  paused_from date not null,
  resumed_on date,
  created_at timestamptz not null default now(),
  constraint activity_pauses_activity_owner_fkey
    foreign key (activity_id, user_id)
    references public.activities(id, user_id)
    on delete cascade,
  constraint activity_pauses_valid_range
    check (resumed_on is null or resumed_on >= paused_from)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  constraint activity_logs_activity_owner_fkey
    foreign key (activity_id, user_id)
    references public.activities(id, user_id)
    on delete cascade,
  constraint activity_logs_user_activity_date_unique
    unique (user_id, activity_id, log_date),
  constraint activity_logs_completed_true check (completed)
);

create table if not exists public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  mood_morning text check (mood_morning in ('bad', 'ok', 'good', 'excellent')),
  mood_evening text check (mood_evening in ('bad', 'ok', 'good', 'excellent')),
  note_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_notes_user_date_unique unique (user_id, note_date),
  constraint daily_notes_note_text_length
    check (note_text is null or char_length(note_text) <= 5000)
);

create index if not exists idx_activities_user_active
  on public.activities(user_id, is_active);
create index if not exists idx_activities_user_schedule_dates
  on public.activities(user_id, start_date, end_date);
create index if not exists idx_activity_logs_user_date
  on public.activity_logs(user_id, log_date);
create index if not exists idx_activity_logs_activity
  on public.activity_logs(activity_id);
create index if not exists idx_activity_pauses_user_activity
  on public.activity_pauses(user_id, activity_id);
create index if not exists idx_activity_pauses_user_dates
  on public.activity_pauses(user_id, paused_from, resumed_on);
create unique index if not exists idx_activity_pauses_one_open
  on public.activity_pauses(activity_id)
  where resumed_on is null;

alter table public.profiles enable row level security;
alter table public.auth_rate_limits enable row level security;
alter table public.activities enable row level security;
alter table public.activity_pauses enable row level security;
alter table public.activity_logs enable row level security;
alter table public.daily_notes enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can view their own activities" on public.activities;
create policy "Users can view their own activities"
  on public.activities for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own activities" on public.activities;
create policy "Users can insert their own activities"
  on public.activities for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own activities" on public.activities;
create policy "Users can update their own activities"
  on public.activities for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own activities" on public.activities;
create policy "Users can delete their own activities"
  on public.activities for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own activity pauses" on public.activity_pauses;
create policy "Users can view their own activity pauses"
  on public.activity_pauses for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.activity_pauses from anon;
revoke insert, update, delete on table public.activity_pauses from authenticated;
grant select on table public.activity_pauses to authenticated;

drop policy if exists "Users can view their own logs" on public.activity_logs;
create policy "Users can view their own logs"
  on public.activity_logs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own logs" on public.activity_logs;
create policy "Users can insert their own logs"
  on public.activity_logs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own logs" on public.activity_logs;
create policy "Users can update their own logs"
  on public.activity_logs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own logs" on public.activity_logs;
create policy "Users can delete their own logs"
  on public.activity_logs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own notes" on public.daily_notes;
create policy "Users can view their own notes"
  on public.daily_notes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own notes" on public.daily_notes;
create policy "Users can insert their own notes"
  on public.daily_notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own notes" on public.daily_notes;
create policy "Users can update their own notes"
  on public.daily_notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own notes" on public.daily_notes;
create policy "Users can delete their own notes"
  on public.daily_notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_notes_updated_at on public.daily_notes;
create trigger trg_daily_notes_updated_at
  before update on public.daily_notes
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

create or replace function public.seed_default_activities(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.activities (
    user_id,
    name,
    schedule_type,
    start_date,
    end_date,
    is_active
  )
  select
    p_user_id,
    defaults.name,
    'daily',
    (now() at time zone 'America/Mexico_City')::date,
    null,
    true
  from (
    values
      ('Gym'),
      ('Estudiar'),
      ('Tomar medicamento'),
      ('Beber agua'),
      ('Dormir temprano')
  ) as defaults(name)
  where not exists (
    select 1
    from public.activities
    where user_id = p_user_id
      and schedule_type = 'daily'
      and name = defaults.name
  );
end;
$$;

create or replace function public.pause_activity(
  p_activity_id uuid,
  p_effective_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_active boolean;
  v_schedule_type text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_effective_date is null then
    raise exception 'Effective date is required' using errcode = '22004';
  end if;

  if p_effective_date <> (now() at time zone 'America/Mexico_City')::date then
    raise exception 'Effective date must be today' using errcode = '22023';
  end if;

  select activities.is_active, activities.schedule_type
    into v_is_active, v_schedule_type
  from public.activities as activities
  where activities.id = p_activity_id
    and activities.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
  end if;

  if v_schedule_type <> 'daily' then
    raise exception 'Only daily activities can be paused' using errcode = '23514';
  end if;

  if not v_is_active then
    raise exception 'Activity is already paused' using errcode = '23514';
  end if;

  insert into public.activity_pauses (activity_id, user_id, paused_from)
  values (p_activity_id, v_user_id, p_effective_date);

  update public.activities
  set is_active = false
  where id = p_activity_id
    and user_id = v_user_id;
end;
$$;

create or replace function public.resume_activity(
  p_activity_id uuid,
  p_effective_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_active boolean;
  v_schedule_type text;
  v_pause_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_effective_date is null then
    raise exception 'Effective date is required' using errcode = '22004';
  end if;

  if p_effective_date <> (now() at time zone 'America/Mexico_City')::date then
    raise exception 'Effective date must be today' using errcode = '22023';
  end if;

  select activities.is_active, activities.schedule_type
    into v_is_active, v_schedule_type
  from public.activities as activities
  where activities.id = p_activity_id
    and activities.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
  end if;

  if v_schedule_type <> 'daily' then
    raise exception 'Only daily activities can be resumed' using errcode = '23514';
  end if;

  if v_is_active then
    raise exception 'Activity is already active' using errcode = '23514';
  end if;

  update public.activity_pauses
  set resumed_on = p_effective_date
  where activity_id = p_activity_id
    and user_id = v_user_id
    and resumed_on is null
    and paused_from <= p_effective_date
  returning id into v_pause_id;

  if v_pause_id is null then
    raise exception 'Open pause not found' using errcode = 'P0002';
  end if;

  update public.activities
  set is_active = true
  where id = p_activity_id
    and user_id = v_user_id;
end;
$$;

revoke all on function public.pause_activity(uuid, date) from public, anon;
revoke all on function public.resume_activity(uuid, date) from public, anon;
grant execute on function public.pause_activity(uuid, date) to authenticated;
grant execute on function public.resume_activity(uuid, date) to authenticated;

create or replace function public.create_activity(
  p_name text,
  p_schedule_type text,
  p_start_date date,
  p_end_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_normalized_name text;
  v_activity_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 200 then
    raise exception 'Invalid activity name' using errcode = '22023';
  end if;

  if p_schedule_type is null
     or p_schedule_type not in ('daily', 'single', 'range')
     or p_start_date is null
     or (p_schedule_type = 'daily' and p_end_date is not null)
     or (p_schedule_type = 'single' and p_end_date is distinct from p_start_date)
     or (p_schedule_type = 'range' and (p_end_date is null or p_end_date < p_start_date)) then
    raise exception 'Invalid activity schedule' using errcode = '22023';
  end if;

  v_normalized_name := lower(btrim(p_name));

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      pg_catalog.concat_ws(
        E'\x1f',
        v_user_id::text,
        v_normalized_name,
        p_schedule_type,
        p_start_date::text,
        coalesce(p_end_date::text, 'null')
      ),
      0
    )
  );

  if exists (
    select 1
    from public.activities as activities
    where activities.user_id = v_user_id
      and lower(btrim(activities.name)) = v_normalized_name
      and activities.schedule_type = p_schedule_type
      and activities.start_date = p_start_date
      and activities.end_date is not distinct from p_end_date
  ) then
    raise exception 'duplicate_activity' using errcode = '23505';
  end if;

  insert into public.activities (
    user_id,
    name,
    schedule_type,
    start_date,
    end_date,
    is_active
  ) values (
    v_user_id,
    btrim(p_name),
    p_schedule_type,
    p_start_date,
    p_end_date,
    true
  )
  returning id into v_activity_id;

  return v_activity_id;
end;
$$;

revoke all on function public.create_activity(text, text, date, date)
  from public, anon;
grant execute on function public.create_activity(text, text, date, date)
  to authenticated;

create or replace function public.edit_activity(
  p_activity_id uuid,
  p_name text,
  p_schedule_type text,
  p_start_date date,
  p_end_date date,
  p_effective_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_activity public.activities%rowtype;
  v_schedule_changed boolean;
  v_new_activity_id uuid;
  v_replacement_start date;
  v_replacement_end date;
  v_identity_start date;
  v_identity_end date;
  v_normalized_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_effective_date is null
     or p_effective_date <> (now() at time zone 'America/Mexico_City')::date then
    raise exception 'Effective date must be today' using errcode = '22023';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 200 then
    raise exception 'Invalid activity name' using errcode = '22023';
  end if;

  if p_schedule_type is null
     or p_schedule_type not in ('daily', 'single', 'range')
     or p_start_date is null
     or (p_schedule_type = 'daily' and p_end_date is not null)
     or (p_schedule_type = 'single' and p_end_date is distinct from p_start_date)
     or (p_schedule_type = 'range' and (p_end_date is null or p_end_date < p_start_date)) then
    raise exception 'Invalid activity schedule' using errcode = '22023';
  end if;

  select activities.*
    into v_activity
  from public.activities as activities
  where activities.id = p_activity_id
    and activities.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
  end if;

  v_schedule_changed :=
    v_activity.schedule_type is distinct from p_schedule_type
    or v_activity.start_date is distinct from p_start_date
    or v_activity.end_date is distinct from p_end_date;

  if v_schedule_changed and v_activity.start_date < p_effective_date then
    v_replacement_start := greatest(p_start_date, p_effective_date);
    v_replacement_end := case
      when p_schedule_type = 'daily' then null
      when p_schedule_type = 'single' then v_replacement_start
      else p_end_date
    end;

    if p_schedule_type = 'range' and v_replacement_end < v_replacement_start then
      raise exception 'Replacement range has already ended' using errcode = '22023';
    end if;

    v_identity_start := v_replacement_start;
    v_identity_end := v_replacement_end;
  else
    v_identity_start := p_start_date;
    v_identity_end := p_end_date;
  end if;

  v_normalized_name := lower(btrim(p_name));

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      pg_catalog.concat_ws(
        E'\x1f',
        v_user_id::text,
        v_normalized_name,
        p_schedule_type,
        v_identity_start::text,
        coalesce(v_identity_end::text, 'null')
      ),
      0
    )
  );

  if exists (
    select 1
    from public.activities as activities
    where activities.user_id = v_user_id
      and activities.id <> p_activity_id
      and lower(btrim(activities.name)) = v_normalized_name
      and activities.schedule_type = p_schedule_type
      and activities.start_date = v_identity_start
      and activities.end_date is not distinct from v_identity_end
  ) then
    raise exception 'duplicate_activity' using errcode = '23505';
  end if;

  if not v_schedule_changed or v_activity.start_date >= p_effective_date then
    update public.activities
    set
      name = btrim(p_name),
      schedule_type = p_schedule_type,
      start_date = p_start_date,
      end_date = p_end_date
    where id = p_activity_id and user_id = v_user_id;

    return p_activity_id;
  end if;

  update public.activities
  set name = btrim(p_name)
  where id = p_activity_id and user_id = v_user_id;

  if v_activity.schedule_type = 'daily' then
    if v_activity.is_active then
      insert into public.activity_pauses (activity_id, user_id, paused_from)
      values (p_activity_id, v_user_id, p_effective_date);

      update public.activities
      set is_active = false
      where id = p_activity_id and user_id = v_user_id;
    end if;
  elsif v_activity.schedule_type = 'range'
        and v_activity.end_date >= p_effective_date then
    update public.activities
    set end_date = p_effective_date - 1
    where id = p_activity_id and user_id = v_user_id;
  end if;

  insert into public.activities (
    user_id,
    name,
    schedule_type,
    start_date,
    end_date,
    is_active
  ) values (
    v_user_id,
    btrim(p_name),
    p_schedule_type,
    v_replacement_start,
    v_replacement_end,
    true
  )
  returning id into v_new_activity_id;

  return v_new_activity_id;
end;
$$;

revoke all on function public.edit_activity(uuid, text, text, date, date, date)
  from public, anon;
grant execute on function public.edit_activity(uuid, text, text, date, date, date)
  to authenticated;
