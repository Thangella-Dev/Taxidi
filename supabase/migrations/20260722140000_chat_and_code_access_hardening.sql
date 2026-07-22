-- Harden ride chat, confirmation code access, and realtime publication for authenticated participants.
-- This migration is additive and safe to apply repeatedly.

drop policy if exists "ride participants view chat" on public.ride_chat_messages;
drop policy if exists "ride participants send chat" on public.ride_chat_messages;

drop policy if exists "users view own ride codes" on public.ride_confirmation_codes;
drop policy if exists "ride participants insert ride codes" on public.ride_confirmation_codes;
drop policy if exists "ride participants update ride codes" on public.ride_confirmation_codes;

create policy "ride participants view chat"
on public.ride_chat_messages for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.ride_requests rr
    where rr.id = ride_chat_messages.ride_id
      and (
        rr.user_id = auth.uid()
        or rr.assigned_rider_id = auth.uid()
      )
  )
);

create policy "ride participants send chat"
on public.ride_chat_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.ride_requests rr
    where rr.id = ride_chat_messages.ride_id
      and rr.status in ('assigned', 'started')
      and (
        rr.user_id = auth.uid()
        or rr.assigned_rider_id = auth.uid()
      )
  )
);

create policy "users view own ride codes"
on public.ride_confirmation_codes for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "ride participants insert ride codes"
on public.ride_confirmation_codes for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy "ride participants update ride codes"
on public.ride_confirmation_codes for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update on public.ride_chat_messages to authenticated;
grant select, insert, update on public.ride_confirmation_codes to authenticated;

revoke execute on function public.get_or_create_ride_confirmation_code(uuid) from anon;
grant execute on function public.get_or_create_ride_confirmation_code(uuid) to authenticated;

do $$
declare
  v_table_name text;
  table_names text[] := array[
    'profiles',
    'ride_requests',
    'rider_locations',
    'rider_routes',
    'ride_status_events',
    'ride_confirmation_codes',
    'ride_chat_messages',
    'rider_profiles',
    'ride_ratings'
  ];
begin
  foreach v_table_name in array table_names loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table_name);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
