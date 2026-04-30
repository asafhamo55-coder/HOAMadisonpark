-- ============================================================
-- 018 — Property Management module
-- ============================================================
-- Tenant-scoped tables for the Property Management product
-- (separate from HOA module's own properties/residents). Names
-- are pm_* prefixed to coexist cleanly with the HOA tables.
--
-- All tables follow the standard tenant_id pattern and use
-- apply_tenant_rls() for the standard 4 policies.
-- ============================================================

create table if not exists public.pm_properties (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  address         text not null,
  city            text,
  state           text,
  zip             text,
  property_type   text check (property_type in ('single_family','multi_family','condo','townhouse','commercial','mixed_use'))
                  default 'single_family',
  year_built      int,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_pm_properties_tenant on public.pm_properties(tenant_id);
select public.apply_tenant_rls('pm_properties');

create table if not exists public.pm_units (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  property_id     uuid not null references public.pm_properties(id) on delete cascade,
  unit_number     text not null,
  bedrooms        int,
  bathrooms       numeric(3,1),
  square_feet     int,
  market_rent     numeric(10,2),
  status          text check (status in ('vacant','occupied','offline')) default 'vacant',
  created_at      timestamptz not null default now()
);
create index if not exists idx_pm_units_tenant on public.pm_units(tenant_id);
create index if not exists idx_pm_units_property on public.pm_units(property_id);
select public.apply_tenant_rls('pm_units');

create table if not exists public.pm_tenants (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  full_name          text not null,
  email              text,
  phone              text,
  emergency_contact  text,
  notes              text,
  created_at         timestamptz not null default now()
);
create index if not exists idx_pm_tenants_tenant on public.pm_tenants(tenant_id);
select public.apply_tenant_rls('pm_tenants');

create table if not exists public.pm_leases (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  unit_id         uuid not null references public.pm_units(id) on delete cascade,
  pm_tenant_id    uuid not null references public.pm_tenants(id) on delete cascade,
  start_date      date not null,
  end_date        date,
  monthly_rent    numeric(10,2) not null,
  deposit         numeric(10,2),
  status          text check (status in ('draft','active','ended','terminated')) default 'draft',
  document_url    text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_pm_leases_tenant on public.pm_leases(tenant_id);
select public.apply_tenant_rls('pm_leases');

create table if not exists public.pm_payments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  lease_id        uuid not null references public.pm_leases(id) on delete cascade,
  amount          numeric(10,2) not null,
  paid_on         date not null default current_date,
  method          text check (method in ('ach','card','cash','check','other')) default 'other',
  category        text check (category in ('rent','deposit','late_fee','utility','other')) default 'rent',
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_pm_payments_tenant on public.pm_payments(tenant_id);
select public.apply_tenant_rls('pm_payments');

create table if not exists public.pm_utilities (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  property_id     uuid references public.pm_properties(id) on delete cascade,
  unit_id         uuid references public.pm_units(id) on delete cascade,
  utility_type    text check (utility_type in ('water','electric','gas','trash','internet','other')) not null,
  provider        text,
  account_number  text,
  paid_by         text check (paid_by in ('owner','tenant')) default 'tenant',
  monthly_estimate numeric(10,2),
  created_at      timestamptz not null default now()
);
create index if not exists idx_pm_utilities_tenant on public.pm_utilities(tenant_id);
select public.apply_tenant_rls('pm_utilities');

create table if not exists public.pm_vendors (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  category        text,
  contact_name    text,
  email           text,
  phone           text,
  insurance_expiry date,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_pm_vendors_tenant on public.pm_vendors(tenant_id);
select public.apply_tenant_rls('pm_vendors');

create table if not exists public.pm_maintenance_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  unit_id         uuid references public.pm_units(id) on delete cascade,
  pm_tenant_id    uuid references public.pm_tenants(id),
  vendor_id       uuid references public.pm_vendors(id),
  title           text not null,
  description     text,
  priority        text check (priority in ('low','medium','high','emergency')) default 'medium',
  status          text check (status in ('open','assigned','scheduled','in_progress','completed','closed')) default 'open',
  reported_at     timestamptz not null default now(),
  completed_at    timestamptz
);
create index if not exists idx_pm_maintenance_tenant on public.pm_maintenance_requests(tenant_id);
select public.apply_tenant_rls('pm_maintenance_requests');
