-- ============================================================
-- Madison Park HOA – Initial Schema
-- ============================================================
-- Conventions:
--   • Every table uses UUID primary keys.
--   • Row Level Security (RLS) is enabled on every table.
--   • Policies follow a role-based model stored in profiles.role:
--       admin / board  → full read-write on all tables
--       resident       → scoped to own property / records
--       vendor         → scoped to own vendor record & jobs
--       any authed     → public announcements & documents
-- ============================================================

-- =====================  TABLES  =============================

-- 1. PROFILES (extends Supabase auth.users)
create table profiles (
  id             uuid references auth.users on delete cascade primary key,
  full_name      text,
  email          text,
  phone          text,
  role           text check (role in ('admin','board','resident','vendor')),
  avatar_url     text,
  created_at     timestamptz default now()
);
alter table profiles enable row level security;

-- 2. PROPERTIES
create table properties (
  id             uuid default gen_random_uuid() primary key,
  address        text not null,
  lot_number     text,
  street         text,
  unit           text,
  zip            text default '30022',
  city           text default 'Johns Creek',
  state          text default 'GA',
  status         text check (status in ('occupied','vacant','foreclosure','rental')) default 'occupied',
  notes          text,
  created_at     timestamptz default now()
);
alter table properties enable row level security;

-- 3. RESIDENTS
create table residents (
  id                      uuid default gen_random_uuid() primary key,
  property_id             uuid references properties on delete cascade,
  profile_id              uuid references profiles,
  full_name               text not null,
  email                   text,
  phone                   text,
  type                    text check (type in ('owner','tenant','co-owner')) default 'owner',
  move_in_date            date,
  move_out_date           date,
  is_current              boolean default true,
  emergency_contact_name  text,
  emergency_contact_phone text,
  vehicles                text[],
  pets                    text[],
  notes                   text,
  created_at              timestamptz default now()
);
alter table residents enable row level security;

-- 4. VIOLATIONS
create table violations (
  id              uuid default gen_random_uuid() primary key,
  property_id     uuid references properties on delete cascade,
  resident_id     uuid references residents,
  category        text not null,
  description     text not null,
  status          text check (status in ('open','notice_sent','warning_sent','fine_issued','resolved','dismissed')) default 'open',
  severity        text check (severity in ('low','medium','high')) default 'medium',
  reported_by     uuid references profiles,
  reported_date   date default current_date,
  due_date        date,
  resolved_date   date,
  fine_amount     numeric(10,2),
  fine_paid       boolean default false,
  photos          text[],
  notes           text,
  created_at      timestamptz default now()
);
alter table violations enable row level security;

-- 5. LETTERS
create table letters (
  id                uuid default gen_random_uuid() primary key,
  property_id       uuid references properties on delete cascade,
  resident_id       uuid references residents,
  violation_id      uuid references violations,
  type              text not null,
  subject           text not null,
  body_html         text not null,
  sent_at           timestamptz,
  sent_by           uuid references profiles,
  recipient_email   text,
  resend_message_id text,
  status            text check (status in ('draft','sent','delivered','failed')) default 'draft',
  created_at        timestamptz default now()
);
alter table letters enable row level security;

-- 6. VENDORS
create table vendors (
  id               uuid default gen_random_uuid() primary key,
  company_name     text not null,
  contact_name     text,
  email            text,
  phone            text,
  category         text,
  address          text,
  license_number   text,
  insurance_expiry date,
  rating           integer check (rating between 1 and 5),
  notes            text,
  is_active        boolean default true,
  created_at       timestamptz default now()
);
alter table vendors enable row level security;

-- 7. VENDOR JOBS
create table vendor_jobs (
  id              uuid default gen_random_uuid() primary key,
  vendor_id       uuid references vendors,
  property_id     uuid references properties,
  title           text not null,
  description     text,
  status          text check (status in ('requested','approved','scheduled','in_progress','completed','cancelled')) default 'requested',
  scheduled_date  date,
  completed_date  date,
  cost            numeric(10,2),
  invoice_url     text,
  notes           text,
  created_at      timestamptz default now()
);
alter table vendor_jobs enable row level security;

-- 8. ANNOUNCEMENTS
create table announcements (
  id            uuid default gen_random_uuid() primary key,
  title         text not null,
  body          text not null,
  type          text check (type in ('general','urgent','event','maintenance','policy')) default 'general',
  send_email    boolean default false,
  published_at  timestamptz,
  expires_at    timestamptz,
  created_by    uuid references profiles,
  created_at    timestamptz default now()
);
alter table announcements enable row level security;

-- 9. DOCUMENTS
create table documents (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  category    text,
  file_url    text not null,
  file_name   text,
  file_size   integer,
  is_public   boolean default true,
  uploaded_by uuid references profiles,
  created_at  timestamptz default now()
);
alter table documents enable row level security;

-- 10. PAYMENTS
create table payments (
  id              uuid default gen_random_uuid() primary key,
  property_id     uuid references properties on delete cascade,
  resident_id     uuid references residents,
  amount          numeric(10,2) not null,
  due_date        date,
  paid_date       date,
  payment_method  text,
  status          text check (status in ('pending','paid','overdue','waived')) default 'pending',
  period          text,
  notes           text,
  created_at      timestamptz default now()
);
alter table payments enable row level security;

-- 11. EMAIL TEMPLATES
create table email_templates (
  id               uuid default gen_random_uuid() primary key,
  name             text not null unique,
  type             text not null,
  subject_template text not null,
  body_template    text not null,
  is_active        boolean default true,
  created_at       timestamptz default now()
);
alter table email_templates enable row level security;


-- =====================  HELPER  =============================
-- Convenience function: returns the role of the currently
-- authenticated user from the profiles table.
-- Used in every RLS policy below.
-- ------------------------------------------------------------
create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- =====================  RLS POLICIES  =======================

-- ----- helpers used in many policies -----
-- "is_admin_or_board" shorthand: role in ('admin','board')
-- "resident_property_ids": properties linked to the current user

-- =========  PROFILES  =======================================

-- Admin / board: full access
create policy "profiles_admin_board_all"
  on profiles for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Any user: read own profile
create policy "profiles_self_read"
  on profiles for select
  using (id = auth.uid());

-- Any user: update own profile
create policy "profiles_self_update"
  on profiles for update
  using  (id = auth.uid())
  with check (id = auth.uid());

-- =========  PROPERTIES  =====================================

create policy "properties_admin_board_all"
  on properties for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Residents: read only their own property (via residents table)
create policy "properties_resident_read"
  on properties for select
  using (
    public.get_user_role() = 'resident'
    and id in (
      select property_id from residents
      where profile_id = auth.uid() and is_current = true
    )
  );

-- =========  RESIDENTS  ======================================

create policy "residents_admin_board_all"
  on residents for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Residents: read own records
create policy "residents_self_read"
  on residents for select
  using (
    public.get_user_role() = 'resident'
    and profile_id = auth.uid()
  );

-- =========  VIOLATIONS  =====================================

create policy "violations_admin_board_all"
  on violations for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Residents: read-only violations on their property
create policy "violations_resident_read"
  on violations for select
  using (
    public.get_user_role() = 'resident'
    and property_id in (
      select property_id from residents
      where profile_id = auth.uid() and is_current = true
    )
  );

-- =========  LETTERS  ========================================

create policy "letters_admin_board_all"
  on letters for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Residents: read letters addressed to them / their property
create policy "letters_resident_read"
  on letters for select
  using (
    public.get_user_role() = 'resident'
    and (
      resident_id in (
        select id from residents where profile_id = auth.uid()
      )
      or property_id in (
        select property_id from residents
        where profile_id = auth.uid() and is_current = true
      )
    )
  );

-- =========  VENDORS  ========================================

create policy "vendors_admin_board_all"
  on vendors for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Vendor users: read & update own record only.
-- Link: profiles.email = vendors.email (vendor signs up with same email).
create policy "vendors_self_read"
  on vendors for select
  using (
    public.get_user_role() = 'vendor'
    and email = (select email from profiles where id = auth.uid())
  );

create policy "vendors_self_update"
  on vendors for update
  using (
    public.get_user_role() = 'vendor'
    and email = (select email from profiles where id = auth.uid())
  )
  with check (
    public.get_user_role() = 'vendor'
    and email = (select email from profiles where id = auth.uid())
  );

-- =========  VENDOR JOBS  ====================================

create policy "vendor_jobs_admin_board_all"
  on vendor_jobs for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Vendor users: read jobs assigned to their vendor record
create policy "vendor_jobs_vendor_read"
  on vendor_jobs for select
  using (
    public.get_user_role() = 'vendor'
    and vendor_id in (
      select id from vendors
      where email = (select email from profiles where id = auth.uid())
    )
  );

-- =========  ANNOUNCEMENTS  ==================================

create policy "announcements_admin_board_all"
  on announcements for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- All authenticated users: read published announcements
create policy "announcements_authed_read"
  on announcements for select
  using (
    auth.uid() is not null
    and published_at is not null
    and published_at <= now()
  );

-- =========  DOCUMENTS  ======================================

create policy "documents_admin_board_all"
  on documents for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- All authenticated users: read public documents
create policy "documents_authed_read_public"
  on documents for select
  using (
    auth.uid() is not null
    and is_public = true
  );

-- =========  PAYMENTS  =======================================

create policy "payments_admin_board_all"
  on payments for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));

-- Residents: read own payments
create policy "payments_resident_read"
  on payments for select
  using (
    public.get_user_role() = 'resident'
    and (
      resident_id in (
        select id from residents where profile_id = auth.uid()
      )
      or property_id in (
        select property_id from residents
        where profile_id = auth.uid() and is_current = true
      )
    )
  );

-- =========  EMAIL TEMPLATES  ================================

create policy "email_templates_admin_board_all"
  on email_templates for all
  using  (public.get_user_role() in ('admin','board'))
  with check (public.get_user_role() in ('admin','board'));


-- =====================  INDEXES  ============================

create index idx_residents_property   on residents   (property_id);
create index idx_residents_profile    on residents   (profile_id);
create index idx_violations_property  on violations  (property_id);
create index idx_violations_status    on violations  (status);
create index idx_letters_property     on letters     (property_id);
create index idx_letters_violation    on letters     (violation_id);
create index idx_vendor_jobs_vendor   on vendor_jobs (vendor_id);
create index idx_vendor_jobs_property on vendor_jobs (property_id);
create index idx_payments_property    on payments    (property_id);
create index idx_payments_status      on payments    (status);
create index idx_announcements_published on announcements (published_at);


-- =====================  SEED EMAIL TEMPLATES  ===============

insert into email_templates (name, type, subject_template, body_template) values

-- 1. Violation Notice
(
  'violation_notice',
  'violation_notice',
  'HOA Violation Notice – {{property_address}}',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 640px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">{{hoa_name}} – Violation Notice</h2>
  <p>Dear {{resident_name}},</p>
  <p>This letter is to inform you that a violation has been observed at your property located at
     <strong>{{property_address}}</strong>.</p>
  <h3 style="color: #b91c1c;">Violation Details</h3>
  <p>{{violation_description}}</p>
  <p>Please correct this violation by <strong>{{due_date}}</strong>. Failure to comply may result
     in further action, including fines as outlined in the community guidelines.</p>
  <p>If you believe this notice was issued in error or have already addressed the issue, please
     contact the HOA management office.</p>
  <br/>
  <p>Sincerely,</p>
  <p><strong>{{board_president_name}}</strong><br/>Board President<br/>{{hoa_name}}</p>
</body>
</html>'
),

-- 2. Warning Letter
(
  'warning_letter',
  'warning_letter',
  'Second Notice / Warning – {{property_address}}',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 640px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">{{hoa_name}} – Warning Letter</h2>
  <p>Dear {{resident_name}},</p>
  <p>We previously notified you of a violation at <strong>{{property_address}}</strong>. As of the
     date of this letter, the issue has not been resolved.</p>
  <h3 style="color: #b91c1c;">Violation Details</h3>
  <p>{{violation_description}}</p>
  <p>This is your <strong>second and final warning</strong>. You must correct the violation by
     <strong>{{due_date}}</strong>. If the matter is not resolved by that date, a fine of
     <strong>${{fine_amount}}</strong> will be assessed to your account.</p>
  <p>Please contact the HOA management office if you need assistance or wish to discuss this matter.</p>
  <br/>
  <p>Sincerely,</p>
  <p><strong>{{board_president_name}}</strong><br/>Board President<br/>{{hoa_name}}</p>
</body>
</html>'
),

-- 3. Fine Notice
(
  'fine_notice',
  'fine_notice',
  'Fine Assessment – {{property_address}}',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 640px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">{{hoa_name}} – Fine Notice</h2>
  <p>Dear {{resident_name}},</p>
  <p>Despite prior notices, the violation at <strong>{{property_address}}</strong> has not been
     corrected.</p>
  <h3 style="color: #b91c1c;">Violation Details</h3>
  <p>{{violation_description}}</p>
  <h3>Fine Assessment</h3>
  <p>A fine of <strong>${{fine_amount}}</strong> has been assessed to your account. Payment is due
     by <strong>{{due_date}}</strong>.</p>
  <p>Continued non-compliance may result in additional fines and/or legal action as permitted by
     the community governing documents.</p>
  <p>To make a payment or to dispute this fine, please contact the HOA management office.</p>
  <br/>
  <p>Sincerely,</p>
  <p><strong>{{board_president_name}}</strong><br/>Board President<br/>{{hoa_name}}</p>
</body>
</html>'
),

-- 4. Welcome Letter
(
  'welcome_letter',
  'welcome_letter',
  'Welcome to {{hoa_name}}!',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 640px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">Welcome to {{hoa_name}}!</h2>
  <p>Dear {{resident_name}},</p>
  <p>On behalf of the Board of Directors and your neighbors, welcome to
     <strong>{{property_address}}</strong>!</p>
  <p>We are delighted to have you as part of our community. Here are a few things to help you
     get started:</p>
  <ul>
    <li>Community rules and regulations are available on the resident portal.</li>
    <li>HOA dues information and payment options can be found in your account dashboard.</li>
    <li>Board meetings are held monthly — dates are posted under Announcements.</li>
    <li>For maintenance requests or concerns, please submit a request through the portal.</li>
  </ul>
  <p>If you have any questions, don''t hesitate to reach out to the HOA management office.</p>
  <br/>
  <p>Warm regards,</p>
  <p><strong>{{board_president_name}}</strong><br/>Board President<br/>{{hoa_name}}</p>
</body>
</html>'
),

-- 5. General Announcement
(
  'general_announcement',
  'general_announcement',
  '{{hoa_name}} Announcement',
  '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 640px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">{{hoa_name}} – Community Announcement</h2>
  <p>Dear {{resident_name}},</p>
  <p>{{violation_description}}</p>
  <p>If you have any questions or concerns, please do not hesitate to contact the HOA management
     office.</p>
  <br/>
  <p>Best regards,</p>
  <p><strong>{{board_president_name}}</strong><br/>Board President<br/>{{hoa_name}}</p>
</body>
</html>'
);
