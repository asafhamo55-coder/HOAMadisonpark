-- ============================================================
-- Homeowner Hub – Workspaces, Memberships, Module Entitlements
-- ============================================================
-- Introduces the multi-product workspace concept that wraps
-- the existing HOA tables. Existing rows are backfilled into a
-- single "Madison Park" workspace so the HOA app keeps working.
-- ============================================================

-- 1. WORKSPACES
create table if not exists workspaces (
  id              uuid default gen_random_uuid() primary key,
  slug            text unique not null,
  name            text not null,
  type            text check (type in ('hoa','homeowner','property_manager','law_firm')) default 'homeowner',
  owner_id        uuid references profiles(id),
  billing_email   text,
  created_at      timestamptz default now()
);
alter table workspaces enable row level security;

-- 2. WORKSPACE MEMBERS
create table if not exists workspace_members (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid references workspaces(id) on delete cascade,
  profile_id      uuid references profiles(id) on delete cascade,
  role            text check (role in ('owner','admin','manager','staff','viewer')) default 'staff',
  created_at      timestamptz default now(),
  unique (workspace_id, profile_id)
);
alter table workspace_members enable row level security;
create index if not exists idx_workspace_members_profile on workspace_members(profile_id);
create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id);

-- 3. MODULE ENTITLEMENTS
-- Which products are enabled for a workspace.
create table if not exists workspace_modules (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid references workspaces(id) on delete cascade,
  module          text check (module in ('hoa','property','eviction')) not null,
  status          text check (status in ('active','trial','suspended','canceled')) default 'trial',
  trial_ends_at   timestamptz,
  enabled_at      timestamptz default now(),
  unique (workspace_id, module)
);
alter table workspace_modules enable row level security;

-- 4. SUBSCRIPTIONS (Stripe-ready, schema only)
create table if not exists subscriptions (
  id                     uuid default gen_random_uuid() primary key,
  workspace_id           uuid references workspaces(id) on delete cascade,
  module                 text check (module in ('hoa','property','eviction')) not null,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text default 'inactive',
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  unique (workspace_id, module)
);
alter table subscriptions enable row level security;

-- 5. LEADS (marketing site lead capture)
create table if not exists leads (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  email       text not null,
  interest    text check (interest in ('hoa','property','eviction','all')) default 'all',
  message     text,
  source      text default 'marketing_site',
  created_at  timestamptz default now()
);
alter table leads enable row level security;
-- Anonymous insert allowed (form submissions); reads admin-only.
create policy "anon insert leads" on leads
  for insert to anon, authenticated with check (true);
create policy "admins read leads" on leads
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('admin','board')
    )
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function current_user_workspace_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select wm.workspace_id
  from workspace_members wm
  where wm.profile_id = auth.uid();
$$;

create or replace function workspace_has_module(ws uuid, mod text)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from workspace_modules
    where workspace_id = ws
      and module = mod
      and status in ('active','trial')
  );
$$;

-- ============================================================
-- POLICIES for workspace tables
-- ============================================================

create policy "members read workspace" on workspaces
  for select using (
    id in (select current_user_workspace_ids())
  );
create policy "owners update workspace" on workspaces
  for update using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.profile_id = auth.uid()
        and wm.role in ('owner','admin')
    )
  );
create policy "any authed insert workspace" on workspaces
  for insert to authenticated with check (auth.uid() = owner_id);

create policy "members read members" on workspace_members
  for select using (
    workspace_id in (select current_user_workspace_ids())
  );
create policy "admins manage members" on workspace_members
  for all using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.profile_id = auth.uid()
        and wm.role in ('owner','admin')
    )
  );

create policy "members read modules" on workspace_modules
  for select using (
    workspace_id in (select current_user_workspace_ids())
  );
create policy "admins manage modules" on workspace_modules
  for all using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_modules.workspace_id
        and wm.profile_id = auth.uid()
        and wm.role in ('owner','admin')
    )
  );

create policy "members read subscriptions" on subscriptions
  for select using (
    workspace_id in (select current_user_workspace_ids())
  );

-- ============================================================
-- BACKFILL: existing HOA data into a default workspace
-- ============================================================

do $$
declare
  ws_id uuid;
  any_admin uuid;
begin
  if not exists (select 1 from workspaces where slug = 'madison-park') then
    select id into any_admin from profiles where role in ('admin','board') limit 1;
    insert into workspaces (slug, name, type, owner_id)
    values ('madison-park', 'Madison Park HOA', 'hoa', any_admin)
    returning id into ws_id;

    insert into workspace_modules (workspace_id, module, status)
    values (ws_id, 'hoa', 'active');

    insert into workspace_members (workspace_id, profile_id, role)
    select ws_id, id,
      case when role in ('admin','board') then 'admin'
           when role = 'resident' then 'staff'
           else 'viewer' end
    from profiles
    on conflict do nothing;
  end if;
end $$;

-- Add workspace_id to existing HOA tables (nullable for now to keep
-- the legacy app working; can be tightened in a later migration).
alter table properties      add column if not exists workspace_id uuid references workspaces(id);
alter table residents       add column if not exists workspace_id uuid references workspaces(id);
alter table violations      add column if not exists workspace_id uuid references workspaces(id);

do $$
declare
  ws_id uuid;
begin
  select id into ws_id from workspaces where slug = 'madison-park' limit 1;
  if ws_id is not null then
    update properties set workspace_id = ws_id where workspace_id is null;
    update residents  set workspace_id = ws_id where workspace_id is null;
    update violations set workspace_id = ws_id where workspace_id is null;
  end if;
end $$;
