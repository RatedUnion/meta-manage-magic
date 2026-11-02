-- Meta Page tokens are encrypted by the edge functions and are never exposed via client RLS.
create table if not exists public.meta_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id text not null,
  page_name text not null,
  token_ciphertext text not null,
  token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'reauthorization_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, page_id)
);

create table if not exists public.meta_publish_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.meta_connections(id) on delete set null,
  status text not null check (status in ('published', 'failed', 'reauthorization_required')),
  provider_post_id text,
  provider_error_code integer,
  created_at timestamptz not null default now()
);

alter table public.meta_oauth_states enable row level security;
alter table public.meta_connections enable row level security;
alter table public.meta_publish_events enable row level security;

revoke all on public.meta_oauth_states, public.meta_connections, public.meta_publish_events from anon, authenticated;
grant all on public.meta_oauth_states, public.meta_connections, public.meta_publish_events to service_role;

create index if not exists meta_oauth_states_expiry_idx on public.meta_oauth_states (expires_at);
create index if not exists meta_connections_user_idx on public.meta_connections (user_id, page_name);
create index if not exists meta_publish_events_user_idx on public.meta_publish_events (user_id, created_at desc);

-- Remove expired/redeemed OAuth state records periodically with Supabase Cron or scheduled maintenance.
