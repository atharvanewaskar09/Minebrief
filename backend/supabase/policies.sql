-- Apply in the Supabase SQL editor after `flask db upgrade`.
-- This project stores profiles in public.users and membership in
-- public.workspace_memberships (see the SQLAlchemy models).

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'minebrief-attachments',
  'minebrief-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/x-m4a',
    'audio/mp4'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.minebrief_current_user_id()
returns integer
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select u.id
  from public.users u
  where u.supabase_user_id = (select auth.uid())::text
  limit 1
$$;

create or replace function public.minebrief_is_workspace_member(target_workspace_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = public.minebrief_current_user_id()
  )
$$;

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.shift_reports enable row level security;
alter table public.attendance enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_breakdowns enable row level security;
alter table public.maintenance enable row level security;
alter table public.issues enable row level security;
alter table public.handovers enable row level security;
alter table public.attachments enable row level security;
alter table public.work_completed enable row level security;
alter table public.production_delays enable row level security;
alter table public.safety_observations enable row level security;

drop policy if exists minebrief_users_read_self on public.users;
create policy minebrief_users_read_self on public.users
  for select to authenticated
  using (supabase_user_id = (select auth.uid())::text);

drop policy if exists minebrief_workspaces_member_read on public.workspaces;
create policy minebrief_workspaces_member_read on public.workspaces
  for select to authenticated
  using (public.minebrief_is_workspace_member(id));

drop policy if exists minebrief_memberships_read_self on public.workspace_memberships;
create policy minebrief_memberships_read_self on public.workspace_memberships
  for select to authenticated
  using (user_id = public.minebrief_current_user_id());

drop policy if exists minebrief_reports_member_access on public.shift_reports;
create policy minebrief_reports_member_access on public.shift_reports
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_attendance_member_access on public.attendance;
create policy minebrief_attendance_member_access on public.attendance
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_equipment_member_access on public.equipment;
create policy minebrief_equipment_member_access on public.equipment
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_breakdowns_member_access on public.equipment_breakdowns;
create policy minebrief_breakdowns_member_access on public.equipment_breakdowns
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_maintenance_member_access on public.maintenance;
create policy minebrief_maintenance_member_access on public.maintenance
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_issues_member_access on public.issues;
create policy minebrief_issues_member_access on public.issues
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_attachments_member_access on public.attachments;
create policy minebrief_attachments_member_access on public.attachments
  for all to authenticated
  using (public.minebrief_is_workspace_member(workspace_id))
  with check (public.minebrief_is_workspace_member(workspace_id));

drop policy if exists minebrief_handovers_member_access on public.handovers;
create policy minebrief_handovers_member_access on public.handovers
  for all to authenticated
  using (exists (
    select 1 from public.shift_reports r
    where r.id = handovers.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ))
  with check (exists (
    select 1 from public.shift_reports r
    where r.id = handovers.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ));

drop policy if exists minebrief_work_completed_member_access on public.work_completed;
create policy minebrief_work_completed_member_access on public.work_completed
  for all to authenticated
  using (exists (
    select 1 from public.shift_reports r
    where r.id = work_completed.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ))
  with check (exists (
    select 1 from public.shift_reports r
    where r.id = work_completed.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ));

drop policy if exists minebrief_delays_member_access on public.production_delays;
create policy minebrief_delays_member_access on public.production_delays
  for all to authenticated
  using (exists (
    select 1 from public.shift_reports r
    where r.id = production_delays.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ))
  with check (exists (
    select 1 from public.shift_reports r
    where r.id = production_delays.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ));

drop policy if exists minebrief_safety_member_access on public.safety_observations;
create policy minebrief_safety_member_access on public.safety_observations
  for all to authenticated
  using (exists (
    select 1 from public.shift_reports r
    where r.id = safety_observations.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ))
  with check (exists (
    select 1 from public.shift_reports r
    where r.id = safety_observations.report_id
      and public.minebrief_is_workspace_member(r.workspace_id)
  ));

drop policy if exists minebrief_storage_workspace_read on storage.objects;
create policy minebrief_storage_workspace_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'minebrief-attachments'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and (storage.foldername(name))[3] ~ '^[0-9]+$'
    and exists (
      select 1 from public.shift_reports r
      where r.id = ((storage.foldername(name))[3])::integer
        and r.workspace_id = ((storage.foldername(name))[1])::integer
        and public.minebrief_is_workspace_member(r.workspace_id)
    )
  );

drop policy if exists minebrief_storage_workspace_insert on storage.objects;
create policy minebrief_storage_workspace_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'minebrief-attachments'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] ~ '^[0-9]+$'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (storage.foldername(name))[3] ~ '^[0-9]+$'
    and exists (
      select 1 from public.shift_reports r
      where r.id = ((storage.foldername(name))[3])::integer
        and r.workspace_id = ((storage.foldername(name))[1])::integer
        and public.minebrief_is_workspace_member(r.workspace_id)
    )
  );

drop policy if exists minebrief_storage_workspace_update on storage.objects;
create policy minebrief_storage_workspace_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'minebrief-attachments'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
      select 1 from public.shift_reports r
      where r.id = ((storage.foldername(name))[3])::integer
        and r.workspace_id = ((storage.foldername(name))[1])::integer
        and public.minebrief_is_workspace_member(r.workspace_id)
    )
  )
  with check (
    bucket_id = 'minebrief-attachments'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
      select 1 from public.shift_reports r
      where r.id = ((storage.foldername(name))[3])::integer
        and r.workspace_id = ((storage.foldername(name))[1])::integer
        and public.minebrief_is_workspace_member(r.workspace_id)
    )
  );

drop policy if exists minebrief_storage_workspace_delete on storage.objects;
create policy minebrief_storage_workspace_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'minebrief-attachments'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
      select 1 from public.shift_reports r
      where r.id = ((storage.foldername(name))[3])::integer
        and r.workspace_id = ((storage.foldername(name))[1])::integer
        and public.minebrief_is_workspace_member(r.workspace_id)
    )
  );
