-- Prevent new exact activity duplicates without altering historical rows.

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

revoke all on function public.create_activity(text, text, date, date)
  from public, anon;
grant execute on function public.create_activity(text, text, date, date)
  to authenticated;

revoke all on function public.edit_activity(uuid, text, text, date, date, date)
  from public, anon;
grant execute on function public.edit_activity(uuid, text, text, date, date, date)
  to authenticated;
