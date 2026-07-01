-- One active browser/device per Taxiro account.
-- A new authenticated login replaces the previous device claim.

create table if not exists public.account_sessions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 20 and 200),
  claimed_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.account_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'account_sessions'
      and policyname = 'account owners read active device'
  ) then
    create policy "account owners read active device"
      on public.account_sessions for select to authenticated
      using (profile_id = auth.uid() or public.is_admin());
  end if;
end $$;

create or replace function public.claim_account_session(p_device_id text)
returns public.account_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.account_sessions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_device_id is null or char_length(trim(p_device_id)) not between 20 and 200 then
    raise exception 'Invalid device identifier';
  end if;

  insert into public.account_sessions (profile_id, device_id, claimed_at, last_seen_at)
  values (auth.uid(), trim(p_device_id), now(), now())
  on conflict (profile_id) do update
  set device_id = excluded.device_id,
      claimed_at = now(),
      last_seen_at = now()
  returning * into claimed;

  return claimed;
end $$;

create or replace function public.touch_account_session(p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.account_sessions
  set last_seen_at = now()
  where profile_id = auth.uid() and device_id = trim(p_device_id);
  return found;
end $$;

grant select on public.account_sessions to authenticated;
grant execute on function public.claim_account_session(text) to authenticated;
grant execute on function public.touch_account_session(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'account_sessions'
  ) then
    alter publication supabase_realtime add table public.account_sessions;
  end if;
end $$;

notify pgrst, 'reload schema';
