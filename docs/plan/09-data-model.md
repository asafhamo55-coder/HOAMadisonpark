# 09 — Data Model & Migrations

This is the canonical schema. Every stream references it.

---

## ERD overview

```
                  ┌──────────────┐
                  │   tenants    │
                  └──────┬───────┘
        ┌────────────────┼────────────────┬─────────────────┐
        │                │                │                 │
        ▼                ▼                ▼                 ▼
┌───────────────┐ ┌─────────────┐ ┌────────────────┐ ┌──────────────┐
│ tenant_       │ │ tenant_     │ │ subscriptions  │ │ tenant_      │
│ memberships   │ │ settings    │ │ + invoices     │ │ knowledge_   │
└──────┬────────┘ └─────────────┘ └────────────────┘ │ base         │
       │                                              └──────────────┘
       ▼
┌───────────────┐
│ auth.users    │
└───────────────┘

   per-tenant business tables (all carry tenant_id):
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐
   │ properties  │ │ residents   │ │ violations   │ │ letters    │
   └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐
   │ vendors     │ │ vendor_jobs │ │ announcements│ │ documents  │
   └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐
   │ payments    │ │ requests    │ │ arc_requests │ │ audit_log  │
   └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘
   ┌─────────────────┐ ┌────────────────────┐ ┌────────────────────┐
   │ violation_      │ │ letter_templates   │ │ usage_events       │
   │ categories      │ └────────────────────┘ └────────────────────┘
   └─────────────────┘
```

---

## Migration order

Run migrations in this order:

1. `001_extensions.sql` — `pgcrypto`, `pg_trgm`, `vector`
2. `002_tenants.sql` — tenants, memberships, invitations, helper functions (Stream A)
3. `003_plans_billing.sql` — plans, subscriptions, invoices, usage_events, addons (Stream D)
4. `004_tenant_settings.sql` — tenant_settings, knowledge_base, letter_templates, violation_categories (Stream E)
5. `005_audit.sql` — audit_log, platform_audit_log (Stream A)
6. `006_existing_tables_alter.sql` — add tenant_id to all existing tables (Stream G)
7. `007_madison_park_backfill.sql` — populate Madison Park data (Stream A/G)
8. `008_rls_policies.sql` — apply standard tenant RLS to every business table
9. `009_storage_policies.sql` — storage bucket access scoped by tenant_id path
10. `010_seed_plans.sql` — insert plan rows
11. `011_seed_default_templates.sql` — system letter templates and violation categories
12. `012_indexes.sql` — performance indexes (tenant_id, created_at composite)

---

## Naming conventions

- All table names plural, snake_case: `properties`, `letter_templates`
- Primary keys: `id uuid default gen_random_uuid()`
- Foreign keys: `<entity>_id uuid references <entity>`
- Tenant scoping: `tenant_id uuid not null references tenants on delete cascade` on every business table
- Timestamps: `created_at timestamptz default now()` and `updated_at timestamptz default now()` (with a trigger)
- Soft delete: `deleted_at timestamptz` where applicable
- Status fields: `text` with `check` constraint, never enums (easier to migrate)

---

## Standard table template

```sql
create table <table> (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants on delete cascade,
  -- ... columns ...
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index idx_<table>_tenant_created on <table>(tenant_id, created_at desc);

-- Apply RLS
select apply_tenant_rls('<table>');

-- Updated-at trigger
create trigger <table>_updated_at before update on <table>
  for each row execute function set_updated_at();
```

---

## Audit triggers (light)

For sensitive tables (residents, violations, letters, payments, settings), add an after-trigger that writes to `audit_log` automatically. This catches direct DB edits that bypass server actions.

```sql
create or replace function audit_changes()
returns trigger language plpgsql as $$
begin
  insert into audit_log (tenant_id, actor_id, action, entity, entity_id, metadata)
  values (
    coalesce(new.tenant_id, old.tenant_id),
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return coalesce(new, old);
end;
$$;

create trigger residents_audit after insert or update or delete on residents
  for each row execute function audit_changes();
-- repeat for violations, letters, payments, tenant_settings
```

---

## Performance budget

- Most pages: < 100ms server time, < 1s LCP
- Heaviest queries (audit log, full property list): < 500ms
- Background jobs (bulk import, AI extraction): off the request path, status via polling

Add indexes whenever a new query pattern emerges. Keep `pg_stat_statements` enabled.

---

## Backup & retention

- Supabase daily backups, 30-day retention (Pro tier required)
- Tenant export feature: full snapshot to S3 weekly per active tenant
- Cancellation: keep tenant data 30 days, then archive to cold storage, then delete after 7 years
- Compliance: PII delete-on-request (GDPR/CCPA) — implement `anonymize_tenant(t)` function that null-outs PII columns while preserving aggregates
