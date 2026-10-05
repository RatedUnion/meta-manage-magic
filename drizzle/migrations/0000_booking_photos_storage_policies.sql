-- Customers (anonymous) can upload photos into the booking-photos bucket
create policy "Anyone can upload booking photos"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'booking-photos');

-- Only signed-in staff (admins) can view booking photos
create policy "Admins can view booking photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'booking-photos' and public.has_role(auth.uid(), 'admin'));

-- Admins can delete booking photos
create policy "Admins can delete booking photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'booking-photos' and public.has_role(auth.uid(), 'admin'));