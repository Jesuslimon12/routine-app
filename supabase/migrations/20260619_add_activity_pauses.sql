-- Preserve activity history across repeated pause/reactivation cycles.

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

-- Preserve the current state of activities paused before this migration.
insert into public.activity_pauses (activity_id, user_id, paused_from)
select
  activities.id,
  activities.user_id,
  (now() at time zone 'America/Mexico_City')::date
from public.activities as activities
where not activities.is_active
  and not exists (
    select 1
    from public.activity_pauses as pauses
    where pauses.activity_id = activities.id
      and pauses.resumed_on is null
  );

create index if not exists idx_activity_pauses_user_activity
  on public.activity_pauses(user_id, activity_id);

create index if not exists idx_activity_pauses_user_dates
  on public.activity_pauses(user_id, paused_from, resumed_on);

create unique index if not exists idx_activity_pauses_one_open
  on public.activity_pauses(activity_id)
  where resumed_on is null;

alter table public.activity_pauses enable row level security;

drop policy if exists "Users can view their own activity pauses" on public.activity_pauses;
create policy "Users can view their own activity pauses"
  on public.activity_pauses for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.activity_pauses from anon;
revoke insert, update, delete on table public.activity_pauses from authenticated;
grant select on table public.activity_pauses to authenticated;

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

  select activities.is_active
    into v_is_active
  from public.activities as activities
  where activities.id = p_activity_id
    and activities.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
  end if;

  if not v_is_active then
    raise exception 'Activity is already paused' using errcode = '23514';
  end if;

  insert into public.activity_pauses (
    activity_id,
    user_id,
    paused_from
  ) values (
    p_activity_id,
    v_user_id,
    p_effective_date
  );

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

  select activities.is_active
    into v_is_active
  from public.activities as activities
  where activities.id = p_activity_id
    and activities.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
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
