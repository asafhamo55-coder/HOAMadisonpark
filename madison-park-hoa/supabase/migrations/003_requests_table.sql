-- Requests table for resident submissions (maintenance, ARC, etc.)
create table if not exists requests (
  id              uuid default gen_random_uuid() primary key,
  property_id     uuid references properties on delete cascade,
  resident_id     uuid references residents,
  submitted_by    uuid references profiles,
  type            text check (type in ('maintenance', 'arc', 'general')) not null,
  subject         text not null,
  description     text not null,
  expected_start  date,
  expected_end    date,
  photos          text[],
  attachments     text[],
  status          text check (status in ('submitted', 'under_review', 'approved', 'denied', 'completed')) default 'submitted',
  board_notes     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table requests enable row level security;

-- Admin/board full access
create policy "Admin/board full access to requests"
  on requests for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'board')
    )
  );

-- Residents can read their own requests
create policy "Residents read own requests"
  on requests for select
  using (submitted_by = auth.uid());

-- Residents can insert requests
create policy "Residents insert requests"
  on requests for insert
  with check (submitted_by = auth.uid());

create index idx_requests_property on requests(property_id);
create index idx_requests_submitted_by on requests(submitted_by);
create index idx_requests_status on requests(status);
