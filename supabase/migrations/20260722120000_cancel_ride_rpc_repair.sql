-- Cancellation reliability repair: keep valid user/rider/admin cancellation working under RLS.

alter table public.ride_status_events
  add column if not exists actor_id uuid references public.profiles(id) on delete set null;

create index if not exists ride_status_events_actor_idx
  on public.ride_status_events(actor_id);

alter table public.ride_status_events enable row level security;

drop policy if exists "ride events visible to related parties" on public.ride_status_events;
drop policy if exists "ride events insert related parties" on public.ride_status_events;

create policy "ride events visible to related parties"
on public.ride_status_events for select
to authenticated
using (
  exists (
    select 1
    from public.ride_requests ride
    where ride.id = ride_status_events.ride_id
      and (
        ride.user_id = auth.uid()
        or ride.assigned_rider_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "ride events insert related parties"
on public.ride_status_events for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.ride_requests ride
    where ride.id = ride_status_events.ride_id
      and (
        ride.user_id = auth.uid()
        or ride.assigned_rider_id = auth.uid()
        or public.is_admin()
      )
  )
);

grant select, insert on public.ride_status_events to authenticated;

create or replace function public.cancel_ride(
  p_ride_id uuid,
  p_reason text default 'No reason provided'
)
returns public.ride_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.ride_requests;
  v_actor uuid := auth.uid();
  v_actor_kind text;
  v_reason text := left(coalesce(nullif(trim(p_reason), ''), 'No reason provided'), 240);
  v_previous_user_cancellations integer := 0;
  v_cancellation_fee numeric(10,2) := null;
  v_cancellation_fee_reason text := null;
begin
  if v_actor is null then
    raise exception 'Please sign in again before cancelling this ride.' using errcode = '28000';
  end if;

  select * into v_ride
  from public.ride_requests
  where id = p_ride_id
  for update;

  if v_ride.id is null then
    raise exception 'Ride not found.' using errcode = 'P0002';
  end if;

  if v_ride.status in ('completed', 'cancelled') then
    raise exception 'This ride is already % and cannot be cancelled.', v_ride.status using errcode = '22023';
  end if;

  if v_ride.status not in ('scheduled', 'ready', 'assigned') then
    raise exception 'This ride can no longer be cancelled.' using errcode = '22023';
  end if;

  if v_actor = v_ride.user_id then
    v_actor_kind := 'User';
  elsif v_actor = v_ride.assigned_rider_id and v_ride.status = 'assigned' then
    v_actor_kind := 'Rider';
  elsif public.is_admin() then
    v_actor_kind := 'Admin';
  else
    raise exception 'Only the booking user, assigned rider before pickup, or admin can cancel this ride.' using errcode = '42501';
  end if;

  if v_actor_kind = 'User' and v_ride.status = 'assigned' and v_ride.assigned_rider_id is not null then
    select count(*) into v_previous_user_cancellations
    from public.ride_requests previous
    where previous.user_id = v_ride.user_id
      and previous.id <> v_ride.id
      and previous.status = 'cancelled'
      and (previous.cancelled_by is null or previous.cancelled_by = v_ride.user_id);

    if v_previous_user_cancellations >= 2 then
      v_cancellation_fee := 50.00;
      v_cancellation_fee_reason := 'User cancelled an accepted ride after 2 previous cancellations';
    end if;
  end if;

  update public.ride_requests
  set status = 'cancelled',
      cancellation_reason = v_reason,
      cancellation_fee = v_cancellation_fee,
      cancellation_fee_reason = v_cancellation_fee_reason,
      cancelled_at = now(),
      cancelled_by = v_actor,
      ready_at = null,
      ready_expires_at = null,
      assigned_rider_id = case when v_actor_kind = 'Rider' then null else assigned_rider_id end
  where id = p_ride_id
  returning * into v_ride;

  if v_ride.assigned_rider_id is not null then
    update public.rider_locations
    set is_available = true,
        updated_at = now(),
        last_seen_at = coalesce(last_seen_at, now())
    where rider_id = v_ride.assigned_rider_id;
  elsif v_actor_kind = 'Rider' then
    update public.rider_locations
    set is_available = true,
        updated_at = now(),
        last_seen_at = coalesce(last_seen_at, now())
    where rider_id = v_actor;
  end if;

  insert into public.ride_status_events (ride_id, status, actor_id, note)
  values (
    v_ride.id,
    'cancelled',
    v_actor,
    v_actor_kind || ' cancelled: ' || v_reason ||
      case
        when v_cancellation_fee is null then ''
        else '. Cancellation fine applied: Rs ' || v_cancellation_fee::text
      end
  );

  return v_ride;
end;
$$;

revoke execute on function public.cancel_ride(uuid, text) from anon;
grant execute on function public.cancel_ride(uuid, text) to authenticated;

notify pgrst, 'reload schema';