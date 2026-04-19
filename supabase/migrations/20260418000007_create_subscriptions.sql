create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  plan text not null default 'basic',
  status text not null default 'inactive' check (status in ('active', 'inactive', 'canceled')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Super admins can do everything
create policy "Super admins manage subscriptions"
  on public.subscriptions
  for all
  to authenticated
  using (exists (select 1 from public.super_admins where id = auth.uid()))
  with check (exists (select 1 from public.super_admins where id = auth.uid()));

-- Org members can read their own subscription
create policy "Org members read own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.memberships
      where memberships.organization_id = subscriptions.organization_id
        and memberships.user_id = auth.uid()
    )
  );
