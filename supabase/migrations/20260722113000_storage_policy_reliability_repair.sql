-- Repair Taxiro storage policies for rider verification and UPI assets.
-- Keeps private rider verification photos protected while preventing setup-time policy deadlocks.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('rider-verification', 'rider-verification', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('rider-upi-qr', 'rider-upi-qr', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_view_assigned_rider_photo(p_rider_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ride_requests ride
    where ride.user_id = auth.uid()
      and ride.assigned_rider_id::text = p_rider_id
      and ride.status in ('assigned', 'started', 'completed')
  );
$$;

revoke all on function public.can_view_assigned_rider_photo(text) from public;
grant execute on function public.can_view_assigned_rider_photo(text) to authenticated;

drop policy if exists "riders and admins read verification images" on storage.objects;
drop policy if exists "riders upload own verification images" on storage.objects;
drop policy if exists "riders update own verification images" on storage.objects;
drop policy if exists "rider upi qr public read" on storage.objects;
drop policy if exists "rider upi qr public fetch" on storage.objects;
drop policy if exists "riders upload own upi qr" on storage.objects;
drop policy if exists "riders update own upi qr" on storage.objects;

create policy "riders and admins read verification images"
on storage.objects for select to authenticated
using (
  bucket_id = 'rider-verification'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.can_view_assigned_rider_photo((storage.foldername(name))[1])
  )
);

create policy "riders upload own verification images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rider-verification'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "riders update own verification images"
on storage.objects for update to authenticated
using (
  bucket_id = 'rider-verification'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'rider-verification'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "rider upi qr public read"
on storage.objects for select
using (bucket_id = 'rider-upi-qr');

create policy "riders upload own upi qr"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rider-upi-qr'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "riders update own upi qr"
on storage.objects for update to authenticated
using (
  bucket_id = 'rider-upi-qr'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'rider-upi-qr'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';