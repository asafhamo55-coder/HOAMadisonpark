-- ============================================================
-- 012 — Plans, Subscriptions, Invoices, Usage events, Add-ons
-- ============================================================
-- Stream D — Billing & Subscriptions (Stripe)
--
-- Creates the billing schema:
--   • plans              — catalogue of pricing tiers (text PK, e.g. 'starter')
--   • subscriptions      — one row per tenant Stripe subscription
--   • invoices           — mirror of Stripe invoices (paid/open/past_due/void)
--   • usage_events       — append-only metering for caps + analytics
--   • addons             — opt-in extras like extra emails / extra properties
--
-- Also fulfills the Stream-A deferral by adding the FK
--   tenants.plan_id → plans.id
-- documented in migration 008 as "added in Stream D once plans exists".
--
-- Pricing decision (DECISIONS.md):
--   Trial    $0    | unlimited residents, 14-day trial
--   Starter  $49   | small HOA
--   Standard $129  | mid-sized HOA
--   Pro      $299  | enterprise / multi-association
--   Annual   = monthly × 12 × 0.83 (≈ 17% off, "2 months free")
--
-- Residents are NEVER seat-billable. Only owner/admin/board/committee/vendor
-- memberships count toward seat caps (see lib/limits.ts).
--
-- Stripe lookup_keys mirror plan ids: 'starter_monthly','starter_annual', etc.
-- The actual Stripe price ids are populated by the operator when creating the
-- prices in the Stripe dashboard (test mode only — see DECISIONS.md).
-- ============================================================

-- ============================================================
-- PLANS
-- ============================================================
create table if not exists public.plans (
  id                       text primary key,                       -- 'trial', 'starter', 'standard', 'pro'
  name                     text not null,
  description              text,
  stripe_product_id        text,
  stripe_price_monthly     text,                                   -- Stripe price id, populated post-Stripe-setup
  stripe_price_annual      text,
  monthly_cents            int  not null default 0,
  annual_cents             int  not null default 0,
  property_cap             int,                                    -- null = unlimited
  seat_cap                 int,                                    -- billable seats (excludes residents)
  email_cap_monthly        int,                                    -- null = unlimited
  ai_credits_monthly       int  not null default 0,                -- always 0 in v1 (no AI per DECISIONS.md)
  features                 jsonb not null default '{}'::jsonb,     -- feature flags { white_label, api_access, ... }
  is_public                boolean not null default true,
  sort_order               int  not null default 100,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.plans is
  'Catalogue of pricing tiers. Mirrored from Stripe but the source of truth for the app';
comment on column public.plans.stripe_price_monthly is
  'Stripe price id (price_...). Populated after the operator creates the price in Stripe test mode';
comment on column public.plans.seat_cap is
  'Billable-seat cap. Counts owner|admin|board|committee|vendor memberships. Residents are unlimited';

create index if not exists idx_plans_public_sort on public.plans(is_public, sort_order);

drop trigger if exists plans_updated_at on public.plans;
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

-- Plans are reference data — readable by everyone (anon + authenticated)
-- so the marketing /pricing page can render them without authentication.
alter table public.plans enable row level security;

drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists plans_service_write on public.plans;
create policy plans_service_write on public.plans for all
  to authenticated
  using (false) with check (false);   -- only service_role can mutate

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants on delete cascade,
  stripe_customer_id       text not null,
  stripe_subscription_id   text unique,                            -- unique → idempotency key for webhooks
  plan_id                  text references public.plans(id),
  status                   text not null default 'trialing'
                                  check (status in ('trialing','active','past_due','canceled',
                                                    'unpaid','incomplete','incomplete_expired',
                                                    'paused')),
  billing_cycle            text check (billing_cycle in ('monthly','annual')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  trial_ends_at            timestamptz,
  metadata                 jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.subscriptions is
  'One row per tenant Stripe subscription. Mirrors Stripe state via webhooks';

create index if not exists idx_subscriptions_tenant on public.subscriptions(tenant_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);

-- subscriptions is tenant-scoped, but we apply a stricter clamp than the
-- standard one because writes should NEVER come from a tenant user — only
-- the Stripe webhook (service-role) writes. Reads are open to tenant members.
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_tenant_read on public.subscriptions;
create policy subscriptions_tenant_read on public.subscriptions for select
  using (tenant_id = public.current_tenant_id()
         and public.user_has_tenant_access(tenant_id));

drop policy if exists subscriptions_no_user_write on public.subscriptions;
create policy subscriptions_no_user_write on public.subscriptions for all
  to authenticated
  using (false) with check (false);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists public.invoices (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants on delete cascade,
  subscription_id          uuid references public.subscriptions on delete set null,
  stripe_invoice_id        text unique,                            -- unique → idempotency key
  stripe_customer_id       text,
  number                   text,
  amount_due_cents         int not null default 0,
  amount_paid_cents        int not null default 0,
  currency                 text not null default 'usd',
  status                   text not null
                                  check (status in ('paid','open','past_due','void','draft','uncollectible')),
  hosted_invoice_url       text,
  invoice_pdf              text,
  period_start             timestamptz,
  period_end               timestamptz,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now()
);

comment on table public.invoices is
  'Mirror of Stripe invoices. Used for the in-app invoice history UI';

create index if not exists idx_invoices_tenant_created on public.invoices(tenant_id, created_at desc);
create index if not exists idx_invoices_subscription on public.invoices(subscription_id);
create index if not exists idx_invoices_status on public.invoices(status);

alter table public.invoices enable row level security;

drop policy if exists invoices_tenant_read on public.invoices;
create policy invoices_tenant_read on public.invoices for select
  using (tenant_id = public.current_tenant_id()
         and public.user_has_tenant_access(tenant_id));

drop policy if exists invoices_no_user_write on public.invoices;
create policy invoices_no_user_write on public.invoices for all
  to authenticated
  using (false) with check (false);

-- ============================================================
-- USAGE_EVENTS
-- ============================================================
create table if not exists public.usage_events (
  id          bigserial primary key,
  tenant_id   uuid not null references public.tenants on delete cascade,
  metric      text not null,                       -- 'email_sent', 'property_created', 'seat_added', ...
  quantity    int  not null default 1,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.usage_events is
  'Append-only meter for chargeable / capped actions. Read by lib/limits.ts';

create index if not exists idx_usage_events_tenant_metric_created
  on public.usage_events(tenant_id, metric, created_at desc);

-- usage_events: members can read their own tenant's usage; anyone with a
-- tenant context can insert (so server actions can meter). Inserts are
-- tenant-clamped via the standard apply_tenant_rls helper.
select public.apply_tenant_rls('usage_events');

-- ============================================================
-- ADDONS
-- ============================================================
create table if not exists public.addons (
  id                              uuid primary key default gen_random_uuid(),
  tenant_id                       uuid not null references public.tenants on delete cascade,
  type                            text not null check (type in ('extra_emails','extra_properties','extra_seats','white_label')),
  qty                             int  not null default 1,
  stripe_subscription_item_id     text,
  active                          boolean not null default true,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

comment on table public.addons is
  'Per-tenant opt-in extras. extra_emails: +1000/mo per qty; extra_properties: +50 per qty';

create index if not exists idx_addons_tenant_active on public.addons(tenant_id) where active;

alter table public.addons enable row level security;

drop policy if exists addons_tenant_read on public.addons;
create policy addons_tenant_read on public.addons for select
  using (tenant_id = public.current_tenant_id()
         and public.user_has_tenant_access(tenant_id));

drop policy if exists addons_no_user_write on public.addons;
create policy addons_no_user_write on public.addons for all
  to authenticated
  using (false) with check (false);

drop trigger if exists addons_updated_at on public.addons;
create trigger addons_updated_at before update on public.addons
  for each row execute function public.set_updated_at();

-- ============================================================
-- TENANTS.PLAN_ID FK (Stream-A deferral fulfilled here)
-- ============================================================
-- Migration 008 created tenants.plan_id with no FK because the plans
-- table did not yet exist. Wire it now.
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
     where table_schema = 'public'
       and table_name = 'tenants'
       and constraint_name = 'fk_tenants_plan'
  ) then
    alter table public.tenants
      add constraint fk_tenants_plan
      foreign key (plan_id) references public.plans(id)
      on delete set null;
  end if;
end $$;

-- ============================================================
-- SEED — 4 plans per DECISIONS.md
-- ============================================================
-- Annual = monthly × 12 × 0.83, rounded to nearest dollar:
--   starter   $49 → annual $488   (49 * 12 * 0.83 = 487.84)
--   standard $129 → annual $1,285 (129 * 12 * 0.83 = 1284.84)
--   pro      $299 → annual $2,978 (299 * 12 * 0.83 = 2977.64)
-- Cents below are dollars × 100.

insert into public.plans (
  id, name, description,
  monthly_cents, annual_cents,
  property_cap, seat_cap, email_cap_monthly, ai_credits_monthly,
  features, is_public, sort_order
) values
  ('trial',
   'Free Trial',
   '14-day full-access trial. No credit card required.',
   0, 0,
   100, 5, 1000, 0,
   '{"trial": true, "white_label": false, "api_access": false}'::jsonb,
   false, 0),

  ('starter',
   'Starter',
   'For small communities up to 100 properties.',
   4900, 48800,
   100, 5, 3000, 0,
   '{"white_label": false, "api_access": false, "priority_support": false}'::jsonb,
   true, 10),

  ('standard',
   'Standard',
   'For mid-sized HOAs up to 500 properties.',
   12900, 128500,
   500, 15, 10000, 0,
   '{"white_label": false, "api_access": true, "priority_support": false}'::jsonb,
   true, 20),

  ('pro',
   'Pro',
   'Unlimited properties + white-label for management companies.',
   29900, 297800,
   null, null, 50000, 0,
   '{"white_label": true, "api_access": true, "priority_support": true}'::jsonb,
   true, 30)
on conflict (id) do update set
  name              = excluded.name,
  description       = excluded.description,
  monthly_cents     = excluded.monthly_cents,
  annual_cents      = excluded.annual_cents,
  property_cap      = excluded.property_cap,
  seat_cap          = excluded.seat_cap,
  email_cap_monthly = excluded.email_cap_monthly,
  features          = excluded.features,
  is_public         = excluded.is_public,
  sort_order        = excluded.sort_order,
  updated_at        = now();

-- Backfill: any tenant currently in 'trial' status without a plan_id gets the
-- trial plan so the FK is consistent and the limits helper has caps to read.
update public.tenants
   set plan_id = 'trial'
 where plan_id is null
   and status = 'trial';

-- ============================================================
-- DONE.
--
-- Stripe sync workflow (operator):
--   1. Create products + prices in Stripe (TEST mode only) with lookup_keys
--      starter_monthly, starter_annual, standard_monthly, standard_annual,
--      pro_monthly, pro_annual.
--   2. Update plans.stripe_product_id and stripe_price_* via the platform
--      console (Stream F) or direct SQL.
-- ============================================================
