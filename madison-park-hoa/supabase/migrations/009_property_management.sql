-- ============================================================
-- Property Management module schema
-- ============================================================

create table if not exists pm_properties (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  address         text not null,
  city            text,
  state           text,
  zip             text,
  property_type   text check (property_type in ('single_family','multi_family','condo','townhouse','commercial','mixed_use')) default 'single_family',
  year_built      int,
  notes           text,
  created_at      timestamptz default now()
);
alter table pm_properties enable row level security;
create index if not exists idx_pm_properties_workspace on pm_properties(workspace_id);

create table if not exists pm_units (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  property_id     uuid not null references pm_properties(id) on delete cascade,
  unit_number     text not null,
  bedrooms        int,
  bathrooms       numeric(3,1),
  square_feet     int,
  market_rent     numeric(10,2),
  status          text check (status in ('vacant','occupied','offline')) default 'vacant',
  created_at      timestamptz default now()
);
alter table pm_units enable row level security;

create table if not exists pm_tenants (
  id                 uuid default gen_random_uuid() primary key,
  workspace_id       uuid not null references workspaces(id) on delete cascade,
  full_name          text not null,
  email              text,
  phone              text,
  emergency_contact  text,
  notes              text,
  created_at         timestamptz default now()
);
alter table pm_tenants enable row level security;

create table if not exists pm_leases (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  unit_id         uuid not null references pm_units(id) on delete cascade,
  tenant_id       uuid not null references pm_tenants(id) on delete cascade,
  start_date      date not null,
  end_date        date,
  monthly_rent    numeric(10,2) not null,
  deposit         numeric(10,2),
  status          text check (status in ('draft','active','ended','terminated')) default 'draft',
  document_url    text,
  created_at      timestamptz default now()
);
alter table pm_leases enable row level security;

create table if not exists pm_payments (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  lease_id        uuid not null references pm_leases(id) on delete cascade,
  amount          numeric(10,2) not null,
  paid_on         date not null default current_date,
  method          text check (method in ('ach','card','cash','check','other')) default 'other',
  category        text check (category in ('rent','deposit','late_fee','utility','other')) default 'rent',
  notes           text,
  created_at      timestamptz default now()
);
alter table pm_payments enable row level security;

create table if not exists pm_utilities (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  property_id     uuid references pm_properties(id) on delete cascade,
  unit_id         uuid references pm_units(id) on delete cascade,
  utility_type    text check (utility_type in ('water','electric','gas','trash','internet','other')) not null,
  provider        text,
  account_number  text,
  paid_by         text check (paid_by in ('owner','tenant')) default 'tenant',
  monthly_estimate numeric(10,2),
  created_at      timestamptz default now()
);
alter table pm_utilities enable row level security;

create table if not exists pm_vendors (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  category        text,
  contact_name    text,
  email           text,
  phone           text,
  insurance_expiry date,
  notes           text,
  created_at      timestamptz default now()
);
alter table pm_vendors enable row level security;

create table if not exists pm_maintenance_requests (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  unit_id         uuid references pm_units(id) on delete cascade,
  tenant_id       uuid references pm_tenants(id),
  vendor_id       uuid references pm_vendors(id),
  title           text not null,
  description     text,
  priority        text check (priority in ('low','medium','high','emergency')) default 'medium',
  status          text check (status in ('open','assigned','scheduled','in_progress','completed','closed')) default 'open',
  reported_at     timestamptz default now(),
  completed_at    timestamptz
);
alter table pm_maintenance_requests enable row level security;

-- ============================================================
-- RLS: members of a workspace with the property module enabled
-- ============================================================

create or replace function pm_can_access(ws uuid)
returns boolean
language sql stable security definer as $$
  select ws in (select current_user_workspace_ids())
     and workspace_has_module(ws, 'property');
$$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'pm_properties','pm_units','pm_tenants','pm_leases',
      'pm_payments','pm_utilities','pm_vendors','pm_maintenance_requests'
    ])
  loop
    execute format(
      'create policy "pm members read %1$I" on %1$I for select using (pm_can_access(workspace_id));', t
    );
    execute format(
      'create policy "pm members write %1$I" on %1$I for all using (pm_can_access(workspace_id)) with check (pm_can_access(workspace_id));', t
    );
  end loop;
end $$;
