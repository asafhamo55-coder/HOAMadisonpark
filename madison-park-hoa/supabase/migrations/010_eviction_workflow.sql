-- ============================================================
-- Eviction Hub schema – generic workflow engine
-- ============================================================
-- A workflow is a JSON-defined state machine keyed by jurisdiction
-- (state + county). A case is an instance of a workflow, with
-- typed events recording every transition.
-- ============================================================

create table if not exists ev_jurisdictions (
  id              uuid default gen_random_uuid() primary key,
  state_code      text not null,
  county          text not null,
  display_name    text not null,
  active          boolean default true,
  unique (state_code, county)
);
alter table ev_jurisdictions enable row level security;

create table if not exists ev_workflow_definitions (
  id              uuid default gen_random_uuid() primary key,
  jurisdiction_id uuid references ev_jurisdictions(id) on delete cascade,
  version         int not null default 1,
  name            text not null,
  description     text,
  definition      jsonb not null,  -- { stages: [{ key, label, required_docs, deadline_days, next }] }
  active          boolean default true,
  created_at      timestamptz default now(),
  unique (jurisdiction_id, version)
);
alter table ev_workflow_definitions enable row level security;

create table if not exists ev_cases (
  id                uuid default gen_random_uuid() primary key,
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  case_number       text,                  -- internal reference
  court_case_number text,
  jurisdiction_id   uuid references ev_jurisdictions(id),
  workflow_id       uuid references ev_workflow_definitions(id),
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
  created_by        uuid references profiles(id),
  created_at        timestamptz default now()
);
alter table ev_cases enable row level security;
create index if not exists idx_ev_cases_workspace on ev_cases(workspace_id);
create index if not exists idx_ev_cases_status on ev_cases(status);

create table if not exists ev_case_events (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  case_id         uuid not null references ev_cases(id) on delete cascade,
  event_type      text not null,        -- e.g. notice_served, filing_submitted, hearing_scheduled, judgment_entered, transition
  from_stage      text,
  to_stage        text,
  notes           text,
  payload         jsonb,
  occurred_at     timestamptz default now(),
  actor_id        uuid references profiles(id)
);
alter table ev_case_events enable row level security;

create table if not exists ev_case_documents (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  case_id         uuid not null references ev_cases(id) on delete cascade,
  doc_type        text not null,
  title           text not null,
  storage_path    text,
  generated       boolean default false,
  uploaded_by     uuid references profiles(id),
  created_at      timestamptz default now()
);
alter table ev_case_documents enable row level security;

-- ============================================================
-- RLS
-- ============================================================

create or replace function ev_can_access(ws uuid)
returns boolean
language sql stable security definer as $$
  select ws in (select current_user_workspace_ids())
     and workspace_has_module(ws, 'eviction');
$$;

create policy "ev jurisdictions readable" on ev_jurisdictions
  for select using (true);
create policy "ev workflows readable" on ev_workflow_definitions
  for select using (true);

do $$
declare t text;
begin
  for t in
    select unnest(array['ev_cases','ev_case_events','ev_case_documents'])
  loop
    execute format(
      'create policy "ev members read %1$I" on %1$I for select using (ev_can_access(workspace_id));', t
    );
    execute format(
      'create policy "ev members write %1$I" on %1$I for all using (ev_can_access(workspace_id)) with check (ev_can_access(workspace_id));', t
    );
  end loop;
end $$;

-- ============================================================
-- SEED jurisdictions + workflows
-- (GA – Rockdale County, GA – DeKalb County [Decatur])
-- ============================================================
-- These are simplified workflow templates intended for software
-- bookkeeping. They are NOT legal advice and should be reviewed by
-- counsel before being used to drive real filings.

insert into ev_jurisdictions (state_code, county, display_name)
values
  ('GA','Rockdale','Georgia – Rockdale County'),
  ('GA','DeKalb','Georgia – DeKalb County (Decatur)')
on conflict do nothing;

with j as (
  select id, state_code, county from ev_jurisdictions
  where (state_code,county) in (('GA','Rockdale'),('GA','DeKalb'))
)
insert into ev_workflow_definitions (jurisdiction_id, version, name, description, definition)
select
  j.id,
  1,
  'GA Dispossessory – v1 (' || j.county || ')',
  'Georgia dispossessory workflow template for ' || j.county || ' County. Software bookkeeping only; verify with counsel.',
  jsonb_build_object(
    'stages', jsonb_build_array(
      jsonb_build_object(
        'key','demand_for_possession',
        'label','Demand for Possession',
        'description','Oral or written demand to vacate / pay rent.',
        'deadline_days', 0,
        'required_docs', jsonb_build_array('demand_notice'),
        'next','file_dispossessory'
      ),
      jsonb_build_object(
        'key','file_dispossessory',
        'label','File Dispossessory Affidavit',
        'description','File affidavit with magistrate court.',
        'deadline_days', 3,
        'required_docs', jsonb_build_array('dispossessory_affidavit'),
        'next','tenant_answer_period'
      ),
      jsonb_build_object(
        'key','tenant_answer_period',
        'label','Tenant Answer Period',
        'description','Tenant has 7 days from service to answer.',
        'deadline_days', 7,
        'required_docs', jsonb_build_array(),
        'next','hearing'
      ),
      jsonb_build_object(
        'key','hearing',
        'label','Hearing',
        'description','Magistrate hearing if tenant answers.',
        'deadline_days', 14,
        'required_docs', jsonb_build_array('hearing_notice'),
        'next','judgment'
      ),
      jsonb_build_object(
        'key','judgment',
        'label','Judgment',
        'description','Court enters judgment for landlord or tenant.',
        'deadline_days', 7,
        'required_docs', jsonb_build_array('judgment'),
        'next','writ_of_possession'
      ),
      jsonb_build_object(
        'key','writ_of_possession',
        'label','Writ of Possession',
        'description','Issued 7 days after judgment if tenant has not vacated.',
        'deadline_days', 7,
        'required_docs', jsonb_build_array('writ_of_possession'),
        'next','executed'
      ),
      jsonb_build_object(
        'key','executed',
        'label','Writ Executed / Possession',
        'description','Sheriff executes writ; landlord regains possession.',
        'deadline_days', 0,
        'required_docs', jsonb_build_array(),
        'next', null
      )
    )
  )
from j
on conflict do nothing;
