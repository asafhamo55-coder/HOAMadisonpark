-- ============================================================
-- 012 — Onboarding wizard support
-- ============================================================
-- Stream C — Tenant Onboarding Wizard
--
-- Adds:
--   • onboarding_progress  — per-tenant draft state for the 7-step wizard
--   • documents.body_text  — extracted plain-text for full-text search
--                            (governing-doc upload — NO AI / no LLM call)
--   • documents tsvector index for tsvector full-text search
--   • bulk import job tracking on a lightweight import_jobs table
--
-- This migration is additive and safe to apply on top of 008–011.
-- ============================================================

-- ============================================================
-- onboarding_progress
-- ============================================================
create table if not exists public.onboarding_progress (
  tenant_id     uuid primary key references public.tenants on delete cascade,
  step1_done    boolean not null default false,
  step1_data    jsonb,
  step2_done    boolean not null default false,
  step2_data    jsonb,
  step3_done    boolean not null default false,
  step3_data    jsonb,
  step4_done    boolean not null default false,
  step4_data    jsonb,
  step5_done    boolean not null default false,
  step5_data    jsonb,
  step6_done    boolean not null default false,
  step6_data    jsonb,
  step7_done    boolean not null default false,
  step7_data    jsonb,
  current_step  smallint not null default 1 check (current_step between 1 and 7),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.onboarding_progress is
  'Resumable draft state for the Stream C tenant onboarding wizard. One row per tenant; created when Step 1 inserts the tenant.';

create index if not exists idx_onboarding_progress_completed
  on public.onboarding_progress(completed_at)
  where completed_at is null;

-- updated_at trigger (uses set_updated_at() created in migration 008)
drop trigger if exists onboarding_progress_updated_at on public.onboarding_progress;
create trigger onboarding_progress_updated_at
  before update on public.onboarding_progress
  for each row execute function public.set_updated_at();

-- Enable RLS, then apply the standard 4-policy tenant clamp.
-- Note: the primary key IS the tenant_id, so the standard clamp works
-- exactly as on any other business table.
select public.apply_tenant_rls('onboarding_progress');

-- ============================================================
-- documents.body_text  + tsvector full-text index
-- ============================================================
-- Per DECISIONS.md: governing-doc upload extracts plain text via pdf-parse
-- and stores it in documents.body_text for tsvector full-text search.
-- NO LLM / AI call. The body_tsv generated column is the search target.

alter table public.documents
  add column if not exists body_text text;

alter table public.documents
  add column if not exists body_tsv tsvector
    generated always as (to_tsvector('english', coalesce(body_text, ''))) stored;

create index if not exists idx_documents_body_tsv
  on public.documents using gin (body_tsv);

comment on column public.documents.body_text is
  'Plain-text extraction of the uploaded file, populated by the onboarding wizard via pdf-parse. NO LLM call.';
comment on column public.documents.body_tsv is
  'Generated tsvector from body_text. Used for ts_rank queries in the knowledge-base search UI (Stream E).';

-- ============================================================
-- import_jobs — tracking for bulk property/resident imports
-- ============================================================
create table if not exists public.import_jobs (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants on delete cascade,
  kind          text not null check (kind in ('properties','residents','properties_with_residents')),
  status        text not null default 'pending'
                  check (status in ('pending','processing','completed','failed','partial')),
  total_rows    integer not null default 0,
  processed     integer not null default 0,
  inserted      integer not null default 0,
  skipped       integer not null default 0,
  errored       integer not null default 0,
  errors        jsonb,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_by    uuid references auth.users on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_import_jobs_tenant_created
  on public.import_jobs(tenant_id, created_at desc);

drop trigger if exists import_jobs_updated_at on public.import_jobs;
create trigger import_jobs_updated_at
  before update on public.import_jobs
  for each row execute function public.set_updated_at();

select public.apply_tenant_rls('import_jobs');
