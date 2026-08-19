create table if not exists public.community_admin_invites (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  unique (community_id, email)
);

create index if not exists community_admin_invites_email_idx
  on public.community_admin_invites (lower(email), status);

alter table public.community_admin_invites enable row level security;
