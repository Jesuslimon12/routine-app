-- Bring an existing Mi Rutina Diaria database in line with schema.sql.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'daily_notes_note_text_length'
      and conrelid = 'public.daily_notes'::regclass
  ) then
    alter table public.daily_notes
      add constraint daily_notes_note_text_length
      check (note_text is null or char_length(note_text) <= 5000)
      not valid;
    alter table public.daily_notes
      validate constraint daily_notes_note_text_length;
  end if;
end;
$$;

-- Remove impossible tenant relationships before enforcing the composite FK.
delete from public.activity_logs as logs
where not exists (
  select 1
  from public.activities as activities
  where activities.id = logs.activity_id
    and activities.user_id = logs.user_id
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activities_id_user_unique'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_id_user_unique unique (id, user_id);
  end if;
end;
$$;

alter table public.activity_logs
  drop constraint if exists activity_logs_activity_id_fkey;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activity_logs_activity_owner_fkey'
      and conrelid = 'public.activity_logs'::regclass
  ) then
    alter table public.activity_logs
      add constraint activity_logs_activity_owner_fkey
      foreign key (activity_id, user_id)
      references public.activities(id, user_id)
      on delete cascade
      not valid;
    alter table public.activity_logs
      validate constraint activity_logs_activity_owner_fkey;
  end if;
end;
$$;

drop index if exists public.idx_activities_user_id;
drop index if exists public.idx_daily_notes_user_date;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can view their own activities" on public.activities;
create policy "Users can view their own activities"
  on public.activities for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own activities" on public.activities;
create policy "Users can insert their own activities"
  on public.activities for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own activities" on public.activities;
create policy "Users can update their own activities"
  on public.activities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own activities" on public.activities;
create policy "Users can delete their own activities"
  on public.activities for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own logs" on public.activity_logs;
create policy "Users can view their own logs"
  on public.activity_logs for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own logs" on public.activity_logs;
create policy "Users can insert their own logs"
  on public.activity_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own logs" on public.activity_logs;
create policy "Users can update their own logs"
  on public.activity_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own logs" on public.activity_logs;
create policy "Users can delete their own logs"
  on public.activity_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own notes" on public.daily_notes;
create policy "Users can view their own notes"
  on public.daily_notes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own notes" on public.daily_notes;
create policy "Users can insert their own notes"
  on public.daily_notes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own notes" on public.daily_notes;
create policy "Users can update their own notes"
  on public.daily_notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own notes" on public.daily_notes;
create policy "Users can delete their own notes"
  on public.daily_notes for delete to authenticated
  using ((select auth.uid()) = user_id);

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

create or replace function public.seed_default_activities(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.activities (user_id, name, is_recurring, is_active)
  select p_user_id, defaults.name, true, true
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
      and is_recurring
      and name = defaults.name
  );
end;
$$;
