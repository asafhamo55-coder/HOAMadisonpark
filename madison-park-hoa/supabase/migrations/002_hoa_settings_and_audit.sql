-- HOA Settings table (key-value store)
create table if not exists hoa_settings (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz default now(),
  updated_by  uuid references profiles
);

alter table hoa_settings enable row level security;

create policy "Admin/board can read settings"
  on hoa_settings for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );

create policy "Admin can modify settings"
  on hoa_settings for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Seed default settings
insert into hoa_settings (key, value) values
  ('hoa_profile', '{"name": "Madison Park Homeowners Association", "address": "Johns Creek, GA 30022", "phone": "", "email": "board@madisonparkhoa.com", "website": "", "logo_url": "", "board_president": ""}'),
  ('dues_settings', '{"default_amount": 250, "grace_period_days": 15, "late_fee_amount": 25}'),
  ('violation_categories', '[ {"name": "Landscaping", "default_severity": "medium", "due_date_offset_days": 14}, {"name": "Parking", "default_severity": "low", "due_date_offset_days": 7}, {"name": "Noise", "default_severity": "medium", "due_date_offset_days": 7}, {"name": "Trash", "default_severity": "low", "due_date_offset_days": 7}, {"name": "Exterior", "default_severity": "medium", "due_date_offset_days": 30}, {"name": "Pets", "default_severity": "medium", "due_date_offset_days": 14}, {"name": "Signage", "default_severity": "low", "due_date_offset_days": 14}, {"name": "Structure", "default_severity": "high", "due_date_offset_days": 30}, {"name": "Fence/Wall", "default_severity": "medium", "due_date_offset_days": 30}, {"name": "Holiday Decorations", "default_severity": "low", "due_date_offset_days": 14}, {"name": "Unapproved Modification", "default_severity": "high", "due_date_offset_days": 30}, {"name": "Other", "default_severity": "low", "due_date_offset_days": 14} ]')
on conflict (key) do nothing;

-- Audit log table
create table if not exists audit_log (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles,
  user_name   text,
  action      text not null,
  entity_type text,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz default now()
);

alter table audit_log enable row level security;

create policy "Admin/board can read audit log"
  on audit_log for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );

create policy "Admin can insert audit log"
  on audit_log for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );

create index idx_audit_log_created_at on audit_log(created_at desc);
