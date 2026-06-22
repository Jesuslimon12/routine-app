-- Add explicit activity schedules while preserving completion and pause history.

alter table public.activities
  add column if not exists schedule_type text,
  add column if not exists start_date date,
  add column if not exists end_date date;

update public.activities
set
  schedule_type = case when is_recurring then 'daily' else 'single' end,
  start_date = case
    when is_recurring then (created_at at time zone 'America/Mexico_City')::date
    else specific_date
  end,
  end_date = case when is_recurring then null else specific_date end
where schedule_type is null
   or start_date is null;

alter table public.activities
  alter column schedule_type set not null,
  alter column start_date set not null;

alter table public.activities
  drop constraint if exists non_recurring_needs_date,
  drop constraint if exists activities_schedule_valid;

alter table public.activities
  add constraint activities_schedule_valid check (
    (schedule_type = 'daily' and end_date is null)
    or (schedule_type = 'single' and end_date = start_date)
    or (schedule_type = 'range' and end_date >= start_date)
  );

drop index if exists public.idx_activities_specific_date;
create index if not exists idx_activities_user_schedule_dates
  on public.activities(user_id, start_date, end_date);

-- A missing row represents an uncompleted scheduled day.
delete from public.activity_logs where not completed;

alter table public.activity_logs
  alter column completed set default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activity_logs_completed_true'
      and conrelid = 'public.activity_logs'::regclass
  ) then
    alter table public.activity_logs
      add constraint activity_logs_completed_true check (completed);
  end if;
end;
$$;

alter table public.activities
  drop column if exists is_recurring,
  drop column if exists specific_date;

create or replace function public.seed_default_activities(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Mexico_City')::date;
begin
  insert into public.activities (
    user_id,
    name,
    schedule_type,
    start_date,
    end_date,
    is_active
  )
  select p_user_id, defaults.name, 'daily', v_today, null, true
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

  if p_effective_date is null
     or p_effective_date <> (now() at time zone 'America/Mexico_City')::date then
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
  where id = p_activity_id and user_id = v_user_id;
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

  if p_effective_date is null
     or p_effective_date <> (now() at time zone 'America/Mexico_City')::date then
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
  where id = p_activity_id and user_id = v_user_id;
end;
$$;

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

  v_replacement_start := greatest(p_start_date, p_effective_date);
  v_replacement_end := case
    when p_schedule_type = 'daily' then null
    when p_schedule_type = 'single' then v_replacement_start
    else p_end_date
  end;

  if p_schedule_type = 'range' and v_replacement_end < v_replacement_start then
    raise exception 'Replacement range has already ended' using errcode = '22023';
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
