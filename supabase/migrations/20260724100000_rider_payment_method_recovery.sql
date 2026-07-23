-- Let assigned riders recover from failed wallet collection by switching to driver-collected Cash/UPI.

create or replace function public.switch_ride_payment_method(
  p_ride_id uuid,
  p_payment_method text
)
returns public.ride_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.ride_requests;
  v_method text := lower(trim(coalesce(p_payment_method, '')));
begin
  if auth.uid() is null then
    raise exception 'Please sign in before changing payment method.' using errcode = '28000';
  end if;

  if v_method not in ('cash', 'upi', 'driver_direct_upi') then
    raise exception 'Rider can switch only to Cash or UPI collection.' using errcode = '22023';
  end if;

  if v_method = 'upi' then
    v_method := 'driver_direct_upi';
  end if;

  select * into v_ride
  from public.ride_requests
  where id = p_ride_id
  for update;

  if v_ride.id is null then
    raise exception 'Ride not found.' using errcode = 'P0002';
  end if;

  if v_ride.assigned_rider_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the assigned rider can change collection method for this ride.' using errcode = '42501';
  end if;

  if v_ride.status <> 'started' or v_ride.payment_status <> 'awaiting_payment' then
    raise exception 'Payment method can be changed only after reaching drop and before completing payment.' using errcode = '22023';
  end if;

  update public.ride_requests
  set payment_method = v_method,
      payment_status = 'awaiting_payment'
  where id = p_ride_id
  returning * into v_ride;

  insert into public.ride_status_events (ride_id, status, actor_id, note)
  values (
    v_ride.id,
    v_ride.status,
    auth.uid(),
    'Payment collection method changed to ' || case when v_method = 'cash' then 'Cash' else 'UPI' end
  );

  return v_ride;
end;
$$;

revoke execute on function public.switch_ride_payment_method(uuid, text) from anon;
grant execute on function public.switch_ride_payment_method(uuid, text) to authenticated;

notify pgrst, 'reload schema';