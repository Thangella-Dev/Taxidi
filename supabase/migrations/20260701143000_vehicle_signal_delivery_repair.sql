-- Repair vehicle-specific ready and scheduled signal delivery.

create or replace function public.activate_first_verified_vehicle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status = 'verified' then
    update public.rider_profiles profile
    set active_vehicle_type = new.vehicle_type,
        updated_at = now()
    where profile.rider_id = new.rider_id
      and profile.verification_status = 'verified'
      and profile.active_vehicle_type is null;
  end if;
  return new;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'activate_first_verified_vehicle'
      and tgrelid = 'public.rider_vehicles'::regclass
  ) then
    create trigger activate_first_verified_vehicle
      after insert or update of verification_status on public.rider_vehicles
      for each row execute function public.activate_first_verified_vehicle();
  end if;
end $$;

create or replace function public.activate_vehicle_after_identity_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_verified text;
begin
  if new.verification_status = 'verified' and new.active_vehicle_type is null then
    select vehicle_type into first_verified
    from public.rider_vehicles
    where rider_id = new.rider_id and verification_status = 'verified'
    order by case vehicle_type when 'bike' then 1 when 'auto' then 2 else 3 end
    limit 1;

    if first_verified is not null then
      update public.rider_profiles
      set active_vehicle_type = first_verified, updated_at = now()
      where rider_id = new.rider_id and active_vehicle_type is null;
    end if;
  end if;
  return new;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'activate_vehicle_after_identity_approval'
      and tgrelid = 'public.rider_profiles'::regclass
  ) then
    create trigger activate_vehicle_after_identity_approval
      after update of verification_status on public.rider_profiles
      for each row execute function public.activate_vehicle_after_identity_approval();
  end if;
end $$;

update public.rider_profiles profile
set active_vehicle_type = (
      select vehicle.vehicle_type
      from public.rider_vehicles vehicle
      where vehicle.rider_id = profile.rider_id
        and vehicle.verification_status = 'verified'
      order by case vehicle.vehicle_type when 'bike' then 1 when 'auto' then 2 else 3 end
      limit 1
    ),
    updated_at = now()
where profile.active_vehicle_type is null
  and profile.verification_status = 'verified'
  and exists (
    select 1 from public.rider_vehicles vehicle
    where vehicle.rider_id = profile.rider_id
      and vehicle.verification_status = 'verified'
  );

alter policy "users view own rides riders view assigned or ready admins all"
on public.ride_requests
using (
  user_id = auth.uid()
  or assigned_rider_id = auth.uid()
  or public.is_admin()
  or (
    status in ('scheduled', 'ready')
    and public.is_rider()
    and exists (
      select 1
      from public.rider_profiles profile
      join public.rider_vehicles vehicle
        on vehicle.rider_id = profile.rider_id
       and vehicle.vehicle_type = profile.active_vehicle_type
       and vehicle.verification_status = 'verified'
      where profile.rider_id = auth.uid()
        and profile.verification_status = 'verified'
        and profile.active_vehicle_type = ride_requests.vehicle_type
    )
  )
);

notify pgrst, 'reload schema';
