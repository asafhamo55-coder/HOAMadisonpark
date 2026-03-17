-- ============================================
-- 004 — Notifications table + performance indexes
-- ============================================

-- Notifications
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'info',          -- info, violation, fine, payment, announcement
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  link_url    text,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id, is_read) where is_read = false;
create index idx_notifications_user_created on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update own notifications (mark read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Service role / triggers can insert
create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (true);

-- Enable realtime
alter publication supabase_realtime add table public.notifications;

-- ============================================
-- Performance indexes for existing tables
-- ============================================

create index if not exists idx_violations_property on public.violations(property_id);
create index if not exists idx_violations_status on public.violations(status);
create index if not exists idx_residents_property_current on public.residents(property_id, is_current);
create index if not exists idx_letters_property on public.letters(property_id);
create index if not exists idx_payments_property_status on public.payments(property_id, status);
create index if not exists idx_payments_period on public.payments(period);
create index if not exists idx_payments_status on public.payments(status);

-- ============================================
-- Function to auto-create notifications
-- ============================================

-- Notify property owner when a violation is logged
create or replace function public.notify_on_violation()
returns trigger as $$
declare
  v_resident record;
  v_address  text;
begin
  -- Get current resident's profile_id for this property
  select r.profile_id, p.address into v_resident, v_address
  from public.residents r
  join public.properties p on p.id = r.property_id
  where r.property_id = NEW.property_id
    and r.is_current = true
  limit 1;

  if v_resident.profile_id is not null then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      v_resident.profile_id,
      'violation',
      'New Violation Logged',
      'A ' || coalesce(NEW.category, 'violation') || ' violation has been logged for ' || coalesce(v_address, 'your property') || '.',
      '/portal'
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_violation
  after insert on public.violations
  for each row execute function public.notify_on_violation();

-- Notify when a fine is added (letter with fine_amount)
create or replace function public.notify_on_fine()
returns trigger as $$
declare
  v_resident record;
  v_address  text;
begin
  if NEW.fine_amount is not null and NEW.fine_amount > 0 then
    select r.profile_id, p.address into v_resident, v_address
    from public.residents r
    join public.properties p on p.id = r.property_id
    join public.violations v on v.id = NEW.violation_id
    where r.property_id = v.property_id
      and r.is_current = true
    limit 1;

    if v_resident.profile_id is not null then
      insert into public.notifications (user_id, type, title, body, link_url)
      values (
        v_resident.profile_id,
        'fine',
        'Fine Issued: $' || NEW.fine_amount::text,
        'A fine of $' || NEW.fine_amount::text || ' has been issued for ' || coalesce(v_address, 'your property') || '.',
        '/portal'
      );
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_fine
  after insert on public.letters
  for each row execute function public.notify_on_fine();

-- Notify when payment becomes overdue
create or replace function public.notify_on_payment_overdue()
returns trigger as $$
declare
  v_resident record;
begin
  if NEW.status = 'overdue' and (OLD.status is null or OLD.status <> 'overdue') then
    select r.profile_id into v_resident
    from public.residents r
    where r.property_id = NEW.property_id
      and r.is_current = true
    limit 1;

    if v_resident.profile_id is not null then
      insert into public.notifications (user_id, type, title, body, link_url)
      values (
        v_resident.profile_id,
        'payment',
        'Payment Overdue',
        'Your HOA dues payment of $' || NEW.amount::text || ' for ' || coalesce(NEW.period, 'this period') || ' is now overdue.',
        '/portal'
      );
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_payment_overdue
  after update on public.payments
  for each row execute function public.notify_on_payment_overdue();
