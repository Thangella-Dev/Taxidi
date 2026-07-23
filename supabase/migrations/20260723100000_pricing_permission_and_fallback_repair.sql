-- Pricing and cancellation permission reliability repair.
-- Keeps production booking usable when older constraints/policies are still present.

alter table public.ride_requests
  drop constraint if exists ride_requests_vehicle_fare_valid;

alter table public.ride_requests
  drop constraint if exists ride_requests_fare_rate_per_km_check;

alter table public.ride_requests
  drop constraint if exists ride_requests_vehicle_surcharge_matches_type;

alter table public.ride_requests
  add constraint ride_requests_vehicle_surcharge_matches_type
  check (
    (vehicle_type = 'bike' and vehicle_surcharge_per_km = 0)
    or (vehicle_type = 'auto' and vehicle_surcharge_per_km = 1)
    or (vehicle_type in ('car', 'hatchback', 'sedan', 'suv') and vehicle_surcharge_per_km = 2)
  ) not valid;

alter table public.fare_audit_logs enable row level security;

drop policy if exists "profiles insert own fare audit logs" on public.fare_audit_logs;

create policy "profiles insert own fare audit logs"
on public.fare_audit_logs for insert
to authenticated
with check (profile_id = auth.uid() or public.is_admin());

grant insert on public.fare_audit_logs to authenticated;
grant select on public.ride_fare_breakdowns to authenticated;
grant execute on function public.calculate_taxiro_fare(text,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,numeric,boolean,numeric,timestamptz,uuid) to authenticated;
grant execute on function public.attach_ride_fare_breakdown(uuid,jsonb) to authenticated;
grant execute on function public.cancel_ride(uuid,text) to authenticated;

revoke execute on function public.calculate_taxiro_fare(text,numeric,numeric,numeric,numeric,numeric,numeric,numeric,text,numeric,boolean,numeric,timestamptz,uuid) from anon;
revoke execute on function public.attach_ride_fare_breakdown(uuid,jsonb) from anon;
revoke execute on function public.cancel_ride(uuid,text) from anon;

comment on column public.ride_requests.vehicle_surcharge_per_km is
  'Per-kilometre vehicle surcharge above base rate: Bike 0, Auto 1, Car-family vehicles 2 INR.';

notify pgrst, 'reload schema';