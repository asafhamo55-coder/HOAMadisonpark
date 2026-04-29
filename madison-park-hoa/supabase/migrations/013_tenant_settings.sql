-- ============================================================
-- 013 — Tenant settings, knowledge base, letter templates,
--       violation categories
-- ============================================================
-- Stream E — Tenant Configuration, Branding & Knowledge Base
--
-- Free-tier deviations from the original spec:
--   • The pgvector extension is NOT enabled (free Supabase
--     projects may not have it). The `embedding` column is
--     therefore stored as `bytea null` so the schema is
--     forward-compatible with vectors but ships zero-cost.
--   • Knowledge-base search is Postgres tsvector full-text
--     search ONLY. No semantic / AI search, no embeddings
--     populated. A `search_vector` generated column + GIN
--     index drives `plainto_tsquery` lookups.
--   • A `letter_template_versions` table is added so the
--     TipTap editor can persist a version row on every save.
--   • All four tables receive the standard tenant RLS clamp
--     via `apply_tenant_rls()` from migration 008.
-- ============================================================

-- ============================================================
-- 1. tenant_settings
-- ============================================================
create table if not exists public.tenant_settings (
  tenant_id     uuid primary key references public.tenants on delete cascade,
  branding      jsonb not null default '{}'::jsonb,        -- logo_url, primary, accent, letterhead_url, login_image_url
  identity      jsonb not null default '{}'::jsonb,        -- legal_name, address, contact, fiscal_year, time_zone
  finance       jsonb not null default '{}'::jsonb,        -- dues, late fees, fine_schedule rows
  rules         jsonb not null default '{}'::jsonb,        -- leasing cap %, parking, pets, etc.
  categories    jsonb not null default '{}'::jsonb,        -- request categories, vendor categories (violation_categories has its own table)
  features      jsonb not null default '{}'::jsonb,        -- per-tenant feature toggles
  email         jsonb not null default '{}'::jsonb,        -- from_name, reply_to, footer, signature
  notifications jsonb not null default '{}'::jsonb,        -- which events trigger emails / pushes
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users on delete set null
);

comment on table public.tenant_settings is
  'Per-tenant configuration buckets (branding, identity, finance, rules, categories, features, email, notifications).';

-- A tenant_settings row is conceptually 1:1 with tenants.id, so the PK is tenant_id.
-- That's enough for the standard policies — we still mark the tenant_id column with the
-- usual RLS policies via apply_tenant_rls() so the policy names match every other table.
create or replace function public.tenant_settings_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tenant_settings_touch on public.tenant_settings;
create trigger tenant_settings_touch
  before update on public.tenant_settings
  for each row execute function public.tenant_settings_touch();

-- ============================================================
-- 2. tenant_knowledge_base
-- ============================================================
-- We deliberately do NOT enable the pgvector extension. The
-- `embedding` column is bytea so we can either back-fill with
-- pgvector later (cast bytea->vector in a future migration) or
-- swap to a different vector backend. For v1 it stays null.
create table if not exists public.tenant_knowledge_base (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants on delete cascade,
  document_id   uuid references public.documents on delete set null,
  section_path  text,                                       -- e.g., 'leasing.restrictions'
  title         text,
  content       text,
  structured    jsonb,
  citations     jsonb,
  embedding     bytea,                                      -- reserved for future use; never populated in v1
  is_published  boolean not null default false,
  version       int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Postgres full-text search column (replaces pgvector for v1).
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(content, '')
    )
  ) stored
);

comment on column public.tenant_knowledge_base.embedding is
  'Reserved for a future semantic-search backend. NEVER populated in v1; KB search uses Postgres tsvector only.';
comment on column public.tenant_knowledge_base.search_vector is
  'Generated tsvector over (title, content) for plainto_tsquery + ts_rank lookups.';

create index if not exists idx_kb_tenant_section
  on public.tenant_knowledge_base(tenant_id, section_path);
create index if not exists idx_kb_tenant_published
  on public.tenant_knowledge_base(tenant_id, is_published) where is_published = true;
create index if not exists idx_kb_search_vector
  on public.tenant_knowledge_base using gin (search_vector);

drop trigger if exists tenant_knowledge_base_updated_at on public.tenant_knowledge_base;
create trigger tenant_knowledge_base_updated_at
  before update on public.tenant_knowledge_base
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. letter_templates  (Stream E owns this table)
-- ============================================================
-- NOTE: the existing `email_templates` table from migration 002
-- is the legacy single-tenant template store. The Stream E
-- letter_templates table is the new, fully-featured per-tenant
-- letter store with rich text, merge-field metadata, and
-- versioning. The two coexist; Stream G will eventually migrate
-- email_templates content into letter_templates and drop the
-- legacy table.
create table if not exists public.letter_templates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants on delete cascade,
  key           text not null,                              -- 'courtesy_notice', 'first_violation', etc.
  name          text not null,
  description   text,
  channel       text not null default 'letter'              -- 'letter' (PDF) | 'email'
    check (channel in ('letter','email')),
  subject       text,                                       -- email subject (channel='email')
  body_html     text,                                       -- TipTap HTML (rich text)
  body_pdf      text,                                       -- optional override for PDF generator
  variables     jsonb not null default '[]'::jsonb,         -- list of merge fields this template uses
  is_default    boolean not null default false,
  is_system     boolean not null default false,             -- shipped with the app, can be reset
  system_key    text,                                       -- stable identifier of the system template this row is cloned from
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users on delete set null,
  updated_by    uuid references auth.users on delete set null,
  unique (tenant_id, key)
);

create index if not exists idx_letter_templates_tenant_key
  on public.letter_templates(tenant_id, key);
create index if not exists idx_letter_templates_tenant_channel
  on public.letter_templates(tenant_id, channel);

drop trigger if exists letter_templates_updated_at on public.letter_templates;
create trigger letter_templates_updated_at
  before update on public.letter_templates
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. letter_template_versions
-- ============================================================
-- Every save in the TipTap editor writes a row here so users
-- can inspect history and revert. Keep the body inline (no
-- diff storage) — letter HTML is small.
create table if not exists public.letter_template_versions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants on delete cascade,
  template_id  uuid not null references public.letter_templates on delete cascade,
  version      int not null,                                -- monotonic per template
  subject      text,
  body_html    text,
  variables    jsonb not null default '[]'::jsonb,
  edited_by    uuid references auth.users on delete set null,
  edit_note    text,
  created_at   timestamptz not null default now(),
  unique (template_id, version)
);

create index if not exists idx_letter_template_versions_template
  on public.letter_template_versions(template_id, version desc);
create index if not exists idx_letter_template_versions_tenant
  on public.letter_template_versions(tenant_id, created_at desc);

-- ============================================================
-- 5. violation_categories
-- ============================================================
create table if not exists public.violation_categories (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants on delete cascade,
  name                     text not null,
  slug                     text,                              -- machine-friendly key (lawn, parking, etc.)
  description              text,
  default_fine_cents       int not null default 0,
  first_offense_cents      int,
  second_offense_cents     int,
  third_offense_cents      int,
  warning_letter_template  uuid references public.letter_templates on delete set null,
  notice_letter_template   uuid references public.letter_templates on delete set null,
  fine_letter_template     uuid references public.letter_templates on delete set null,
  active                   boolean not null default true,
  sort_order               int not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists idx_violation_categories_tenant_active
  on public.violation_categories(tenant_id, active, sort_order);

drop trigger if exists violation_categories_updated_at on public.violation_categories;
create trigger violation_categories_updated_at
  before update on public.violation_categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. Apply standard tenant RLS clamp
-- ============================================================
select public.apply_tenant_rls('tenant_settings');
select public.apply_tenant_rls('tenant_knowledge_base');
select public.apply_tenant_rls('letter_templates');
select public.apply_tenant_rls('letter_template_versions');
select public.apply_tenant_rls('violation_categories');

-- ============================================================
-- 7. Auto-version trigger on letter_templates
-- ============================================================
-- Every time body_html, subject, or variables changes, snapshot
-- a row into letter_template_versions. Cheap, catches both UI
-- saves and any direct DB edits.
create or replace function public.letter_templates_snapshot_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_version int;
begin
  if (tg_op = 'UPDATE')
     and (new.body_html is not distinct from old.body_html)
     and (new.subject   is not distinct from old.subject)
     and (new.variables is not distinct from old.variables)
  then
    return new; -- nothing meaningful changed
  end if;

  select coalesce(max(version), 0) + 1
    into next_version
    from public.letter_template_versions
   where template_id = new.id;

  insert into public.letter_template_versions
    (tenant_id, template_id, version, subject, body_html, variables, edited_by)
  values
    (new.tenant_id, new.id, next_version, new.subject, new.body_html, new.variables, new.updated_by);

  return new;
end;
$$;

drop trigger if exists letter_templates_snapshot on public.letter_templates;
create trigger letter_templates_snapshot
  after insert or update on public.letter_templates
  for each row execute function public.letter_templates_snapshot_version();

-- ============================================================
-- 8. Bootstrap empty tenant_settings rows for existing tenants
-- ============================================================
-- Madison Park (and any other tenant created before this migration)
-- needs a row so the Settings UI has something to read from on first load.
insert into public.tenant_settings (tenant_id)
select id from public.tenants
where deleted_at is null
on conflict (tenant_id) do nothing;

-- ============================================================
-- DONE.
-- ============================================================
