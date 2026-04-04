-- ============================================
-- 008 — Add occupancy_type to properties
-- ============================================

-- Track whether a property is owner-occupied or rented
alter table properties
  add column if not exists occupancy_type text
  check (occupancy_type in ('owner_occupied', 'rental'))
  default 'owner_occupied';
