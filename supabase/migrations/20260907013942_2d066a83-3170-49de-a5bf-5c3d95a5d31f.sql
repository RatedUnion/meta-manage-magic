-- Staff role system so only verified staff can read/modify bookings
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Staff can read their own roles
create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- Replace permissive authenticated policies on bookings with staff-only policies
drop policy if exists "Signed-in staff can view bookings" on public.bookings;
drop policy if exists "Signed-in staff can update bookings" on public.bookings;
drop policy if exists "Signed-in staff can delete bookings" on public.bookings;

create policy "Staff can view bookings"
on public.bookings
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Staff can update bookings"
on public.bookings
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Staff can delete bookings"
on public.bookings
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Grant admin role to all existing signed-up users (the business owner / staff)
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users
on conflict (user_id, role) do nothing;