-- Keep vehicle-specific signal visibility without recursive RLS policy checks.

create or replace function public.can_view_vehicle_signal(p_vehicle_type text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles account
    join public.rider_profiles profile on profile.rider_id = account.id
    join public.rider_vehicles vehicle
      on vehicle.rider_id = profile.rider_id
     and vehicle.vehicle_type = profile.active_vehicle_type
     and vehicle.verification_status = 'verified'
    where account.id = auth.uid()
      and account.role = 'rider'
      and profile.verification_status = 'verified'
      and profile.active_vehicle_type = p_vehicle_type
  );
$$;

revoke all on function public.can_view_vehicle_signal(text) from public;
grant execute on function public.can_view_vehicle_signal(text) to authenticated;

alter policy "users view own rides riders view assigned or ready admins all"
on public.ride_requests
using (
  user_id = auth.uid()
  or assigned_rider_id = auth.uid()
  or public.is_admin()
  or (
    status in ('scheduled', 'ready')
    and public.can_view_vehicle_signal(vehicle_type)
  )
);

notify pgrst, 'reload schema';
