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

Run migrations in this order. (Numbering reflects the actual files in
`madison-park-hoa/supabase/migrations/`. Stream A landed migrations 008–011;
later streams will append from 012 onward.)

**Already in repo (pre-Stream-A):**

1. `001_init.sql` — original single-tenant schema (Madison Park)
2. `002_hoa_settings_and_audit.sql` — settings, original (single-tenant) audit_log
3. `003_requests_table.sql` — resident maintenance/ARC requests
4. `004_notifications_and_indexes.sql` — notifications + indexes + triggers
5. `005_storage_buckets.sql` — original (single-tenant) storage policies
6. `006_properties_residents_improvements.sql` — schema enhancements
7. `007_email_attachments_and_activity.sql` — email attachments bucket

**Stream A (Foundation & Multi-Tenant Core):**

8. `008_tenants_and_helpers.sql` — tenants, memberships, invitations + helper
   SQL functions (`current_tenant_id`, `user_has_tenant_access`,
   `user_role_in_tenant`, `set_request_tenant`, `apply_tenant_rls`)
9. `009_audit_log.sql` — extends `audit_log` for tenant scoping; creates
   `platform_audit_log` for service-role / cross-tenant ops
10. `010_existing_tables_alter.sql` — adds `tenant_id NOT NULL` to all 14
    existing business tables, backfills Madison Park, drops legacy
    role-based RLS, applies the standard tenant clamp via
    `apply_tenant_rls()`. Row-count audit recorded in
    `tenant_backfill_audit`.
11. `011_storage_policies.sql` — replaces single-tenant storage policies with
    a tenant-id-prefix-based clamp on the existing buckets (violations,
    documents, logos, email-attachments).

**Future (per other streams):**

12. `012_plans_billing.sql` — plans, subscriptions, invoices, usage_events, addons (Stream D)
13. `013_tenant_settings.sql` — tenant_settings, knowledge_base, letter_templates, violation_categories (Stream E)
14. `014_seed_plans.sql` — insert plan rows (Stream D)
15. `015_seed_default_templates.sql` — system letter templates and violation categories (Stream E)
16. `016_indexes.sql` — additional performance indexes as new query patterns emerge

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
