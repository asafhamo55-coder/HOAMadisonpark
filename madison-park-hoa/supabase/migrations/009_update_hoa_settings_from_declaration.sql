-- ============================================
-- 009 — Update settings from HOA Declaration
-- ============================================

-- Update dues settings with declaration-accurate values
update hoa_settings
set value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        value,
        '{grace_period_days}', '10'
      ),
      '{interest_rate_max_percent}', '10'
    ),
    '{working_capital_contribution}', '500'
  ),
  '{late_charge_formula}', '"Greater of $10.00 or 10% of amount due"'
)
where key = 'dues_settings';

-- Add declaration info setting
insert into hoa_settings (key, value)
values (
  'declaration_info',
  '{
    "recorded_date": "2010-01-27",
    "deed_book": "48748",
    "deed_pages": "648-708",
    "recording_number": "2010-0022282",
    "association_name": "Madison Park Property Owners'' Association, Inc.",
    "declarant": "Ashton Atlanta Residential, L.L.C.",
    "leasing_cap_percent": 15,
    "working_capital_contribution": 500,
    "private_streets": ["Trumpet Park", "Old Maple Drive", "Allee Elm Drive", "Urban Ash Court", "Pistace Court"]
  }'::jsonb
)
on conflict (key) do update set value = excluded.value;

-- Add missing violation categories from declaration
-- Only insert if not already present
do $$
declare
  current_cats jsonb;
  new_cats text[] := ARRAY['Vehicles/Parking', 'Drainage', 'Trees', 'Leasing Violation', 'Swimming Pool'];
  cat text;
  severity text;
  days int;
begin
  select value into current_cats from hoa_settings where key = 'violation_categories';
  if current_cats is null then return; end if;

  foreach cat in array new_cats loop
    -- Check if category already exists
    if not exists (
      select 1 from jsonb_array_elements(current_cats) elem
      where elem->>'name' = cat
    ) then
      -- Determine severity and days based on category
      case cat
        when 'Vehicles/Parking' then severity := 'low'; days := 7;
        when 'Drainage' then severity := 'medium'; days := 30;
        when 'Trees' then severity := 'medium'; days := 30;
        when 'Leasing Violation' then severity := 'high'; days := 30;
        when 'Swimming Pool' then severity := 'medium'; days := 14;
        else severity := 'low'; days := 14;
      end case;

      current_cats := current_cats || jsonb_build_object(
        'name', cat,
        'default_severity', severity,
        'due_date_offset_days', days
      );
    end if;
  end loop;

  update hoa_settings set value = current_cats where key = 'violation_categories';
end $$;
