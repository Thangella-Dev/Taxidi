-- Secure assigned-rider identity display and explicit SOS delivery outcomes.

alter table public.safety_alerts
  add column if not exists recipient_phone text,
  add column if not exists delivery_status text not null default 'unlinked';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'safety_alerts_delivery_status_check'
      and conrelid = 'public.safety_alerts'::regclass
  ) then
    alter table public.safety_alerts
      add constraint safety_alerts_delivery_status_check
      check (delivery_status in ('no_contact', 'unlinked', 'in_app'));
  end if;
end $$;

create or replace function public.can_view_assigned_rider_photo(p_rider_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ride_requests ride
    where ride.user_id = auth.uid()
      and ride.assigned_rider_id::text = p_rider_id
      and ride.status in ('assigned', 'started')
  );
$$;

revoke all on function public.can_view_assigned_rider_photo(text) from public;
grant execute on function public.can_view_assigned_rider_photo(text) to authenticated;

alter policy "riders and admins read verification images"
on storage.objects
using (
  bucket_id = 'rider-verification'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.can_view_assigned_rider_photo((storage.foldername(name))[1])
  )
);

create or replace function public.get_assigned_rider_details(p_ride_id uuid)
returns table (
  rider_id uuid,
  full_name text,
  phone text,
  vehicle_type text,
  vehicle_make text,
  vehicle_model text,
  registration_number text,
  rating numeric,
  completed_rides integer,
  photo_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ride.assigned_rider_id,
    account.full_name,
    account.phone,
    ride.vehicle_type,
    vehicle.make,
    vehicle.model,
    vehicle.registration_number,
    profile.rating,
    profile.completed_rides,
    profile.live_selfie_path
  from public.ride_requests ride
  join public.profiles account on account.id = ride.assigned_rider_id
  join public.rider_profiles profile on profile.rider_id = ride.assigned_rider_id
  join public.rider_vehicles vehicle
    on vehicle.rider_id = ride.assigned_rider_id
   and vehicle.vehicle_type = ride.vehicle_type
   and vehicle.verification_status = 'verified'
  where ride.id = p_ride_id
    and ride.assigned_rider_id is not null
    and (
      ride.user_id = auth.uid()
      or ride.assigned_rider_id = auth.uid()
      or public.is_admin()
    );
$$;

revoke all on function public.get_assigned_rider_details(uuid) from public;
grant execute on function public.get_assigned_rider_details(uuid) to authenticated;

create or replace function public.create_safety_alert(
  p_ride_id uuid,
  p_alert_type text,
  p_message text,
  p_lat double precision default null,
  p_lng double precision default null,
  p_accuracy_m numeric default null
)
returns public.safety_alerts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.ride_requests;
  v_profile public.profiles;
  v_recipient uuid;
  v_alert public.safety_alerts;
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_phone text;
  v_delivery text;
begin
  if p_alert_type not in ('sos', 'late_trip', 'route_changed') then
    raise exception 'Unsupported safety alert type';
  end if;

  select * into v_ride from public.ride_requests where id = p_ride_id for update;
  if v_ride.id is null then raise exception 'Ride not found'; end if;
  if v_ride.user_id <> auth.uid() then raise exception 'Only the booking user can trigger a safety alert'; end if;
  if v_ride.status not in ('assigned', 'started') then raise exception 'Safety alerts are available after rider assignment'; end if;

  select * into v_profile from public.profiles where id = auth.uid();
  v_phone := public.normalize_phone(v_profile.emergency_contact_phone);

  select contact.id into v_recipient
  from public.profiles contact
  where public.normalize_phone(contact.phone) = v_phone and contact.id <> auth.uid()
  order by contact.created_at desc limit 1;

  v_delivery := case
    when v_phone is null or v_phone = '' then 'no_contact'
    when v_recipient is null then 'unlinked'
    else 'in_app'
  end;

  select * into v_alert
  from public.safety_alerts alert
  where alert.ride_id = p_ride_id and alert.alert_type = p_alert_type
    and alert.created_at > now() - interval '30 minutes'
  order by alert.created_at desc limit 1;

  if v_alert.id is null then
    insert into public.safety_alerts (
      ride_id, triggered_by, recipient_profile_id, recipient_phone,
      delivery_status, alert_type, message, lat, lng, accuracy_m
    ) values (
      p_ride_id, auth.uid(), v_recipient, nullif(v_phone, ''), v_delivery,
      p_alert_type, coalesce(v_message, 'Taxiro safety alert triggered during ride'),
      p_lat, p_lng, p_accuracy_m
    ) returning * into v_alert;
  else
    update public.safety_alerts
    set recipient_profile_id = coalesce(v_alert.recipient_profile_id, v_recipient),
        recipient_phone = nullif(v_phone, ''),
        delivery_status = case
          when coalesce(v_alert.recipient_profile_id, v_recipient) is not null then 'in_app'
          else v_delivery
        end
    where id = v_alert.id
    returning * into v_alert;
  end if;

  if v_alert.recipient_profile_id is not null and not exists (
    select 1 from public.app_notifications note where note.safety_alert_id = v_alert.id
  ) then
    insert into public.app_notifications (profile_id, title, body, related_ride_id, safety_alert_id)
    values (
      v_alert.recipient_profile_id,
      case when p_alert_type = 'sos' then 'Taxiro SOS alert'
           when p_alert_type = 'late_trip' then 'Taxiro trip delay alert'
           else 'Taxiro route change alert' end,
      coalesce(v_profile.full_name, 'Your emergency contact') || ' may need help during a Taxiro ride. ' || coalesce(v_message, ''),
      p_ride_id,
      v_alert.id
    );
  end if;

  if not exists (
    select 1 from public.ride_status_events event
    where event.ride_id = p_ride_id and event.note = 'Safety alert created: ' || p_alert_type
      and event.created_at > now() - interval '30 minutes'
  ) then
    insert into public.ride_status_events (ride_id, status, actor_id, note)
    values (p_ride_id, v_ride.status, auth.uid(), 'Safety alert created: ' || p_alert_type);
  end if;

  return v_alert;
end $$;

grant execute on function public.create_safety_alert(uuid, text, text, double precision, double precision, numeric) to authenticated;
notify pgrst, 'reload schema';
