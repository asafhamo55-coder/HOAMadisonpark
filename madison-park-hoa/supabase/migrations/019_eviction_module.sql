-- ============================================================
-- 019 — Eviction Hub module
-- ============================================================
-- Generic JSON-defined workflow engine for eviction cases.
-- Each jurisdiction (state + county) gets a workflow definition;
-- a case is an instance of a workflow with stage transitions
-- recorded as ev_case_events.
--
-- Software bookkeeping only. NOT legal advice. Verify per-county
-- rules with counsel before driving real filings.
--
-- Initial seeds: GA – Rockdale County and GA – DeKalb County (Decatur).
-- ============================================================

-- Jurisdictions are global (not tenant-scoped) — every tenant sees
-- the same playbook library.
create table if not exists public.ev_jurisdictions (
  id              uuid primary key default gen_random_uuid(),
  state_code      text not null,
  county          text not null,
  display_name    text not null,
  active          boolean not null default true,
  unique (state_code, county)
);
alter table public.ev_jurisdictions enable row level security;
drop policy if exists "ev jurisdictions readable" on public.ev_jurisdictions;
create policy "ev jurisdictions readable" on public.ev_jurisdictions
  for select using (true);

create table if not exists public.ev_workflow_definitions (
  id              uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.ev_jurisdictions(id) on delete cascade,
  version         int not null default 1,
  name            text not null,
  description     text,
  definition      jsonb not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (jurisdiction_id, version)
);
alter table public.ev_workflow_definitions enable row level security;
drop policy if exists "ev workflows readable" on public.ev_workflow_definitions;
create policy "ev workflows readable" on public.ev_workflow_definitions
  for select using (true);

-- Tenant-scoped: cases, events, documents.
create table if not exists public.ev_cases (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  case_number       text,
  court_case_number text,
  jurisdiction_id   uuid references public.ev_jurisdictions(id),
  workflow_id       uuid references public.ev_workflow_definitions(id),
  current_stage     text not null,
  stage_due_at      timestamptz,
  property_address  text,
  unit              text,
  tenant_name       text,
  tenant_email      text,
  rent_owed         numeric(10,2),
  reason            text check (reason in ('non_payment','lease_violation','holdover','illegal_activity','other')) default 'non_payment',
  status            text check (status in ('open','filed','judgment','dismissed','withdrawn','possession','closed')) default 'open',
  filed_at          timestamptz,
  closed_at         timestamptz,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now()
);
create index if not exists idx_ev_cases_tenant on public.ev_cases(tenant_id);
create index if not exists idx_ev_cases_status on public.ev_cases(status);
select public.apply_tenant_rls('ev_cases');

create table if not exists public.ev_case_events (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  case_id         uuid not null references public.ev_cases(id) on delete cascade,
  event_type      text not null,
  from_stage      text,
  to_stage        text,
  notes           text,
  payload         jsonb,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid references public.profiles(id)
);
create index if not exists idx_ev_case_events_tenant on public.ev_case_events(tenant_id);
create index if not exists idx_ev_case_events_case on public.ev_case_events(case_id);
select public.apply_tenant_rls('ev_case_events');

create table if not exists public.ev_case_documents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  case_id         uuid not null references public.ev_cases(id) on delete cascade,
  doc_type        text not null,
  title           text not null,
  storage_path    text,
  generated       boolean not null default false,
  uploaded_by     uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index if not exists idx_ev_case_documents_tenant on public.ev_case_documents(tenant_id);
select public.apply_tenant_rls('ev_case_documents');

-- ============================================================
-- SEED: GA jurisdictions + workflow templates
-- ============================================================
insert into public.ev_jurisdictions (state_code, county, display_name)
values
  ('GA','Rockdale','Georgia – Rockdale County'),
  ('GA','DeKalb','Georgia – DeKalb County (Decatur)')
on conflict (state_code, county) do nothing;

with j as (
  select id, county from public.ev_jurisdictions
  where (state_code, county) in (('GA','Rockdale'), ('GA','DeKalb'))
)
insert into public.ev_workflow_definitions (jurisdiction_id, version, name, description, definition)
select
  j.id,
  1,
  'GA Dispossessory – v1 (' || j.county || ')',
  'Georgia dispossessory workflow template for ' || j.county || ' County. Software bookkeeping only; verify with counsel.',
  jsonb_build_object(
    'stages', jsonb_build_array(
      jsonb_build_object('key','demand_for_possession','label','Demand for Possession','description','Oral or written demand to vacate / pay rent.','deadline_days', 0,'required_docs', jsonb_build_array('demand_notice'),'next','file_dispossessory'),
      jsonb_build_object('key','file_dispossessory','label','File Dispossessory Affidavit','description','File affidavit with magistrate court.','deadline_days', 3,'required_docs', jsonb_build_array('dispossessory_affidavit'),'next','tenant_answer_period'),
      jsonb_build_object('key','tenant_answer_period','label','Tenant Answer Period','description','Tenant has 7 days from service to answer.','deadline_days', 7,'required_docs', jsonb_build_array(),'next','hearing'),
      jsonb_build_object('key','hearing','label','Hearing','description','Magistrate hearing if tenant answers.','deadline_days', 14,'required_docs', jsonb_build_array('hearing_notice'),'next','judgment'),
      jsonb_build_object('key','judgment','label','Judgment','description','Court enters judgment for landlord or tenant.','deadline_days', 7,'required_docs', jsonb_build_array('judgment'),'next','writ_of_possession'),
      jsonb_build_object('key','writ_of_possession','label','Writ of Possession','description','Issued 7 days after judgment if tenant has not vacated.','deadline_days', 7,'required_docs', jsonb_build_array('writ_of_possession'),'next','executed'),
      jsonb_build_object('key','executed','label','Writ Executed / Possession','description','Sheriff executes writ; landlord regains possession.','deadline_days', 0,'required_docs', jsonb_build_array(),'next', null)
    )
  )
from j
on conflict (jurisdiction_id, version) do nothing;
