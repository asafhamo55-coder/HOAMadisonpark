-- ============================================================
-- 006 – Properties & Residents Schema Improvements
-- ============================================================
-- Adds property_type, country, address_line1/2, updated_at to properties.
-- Adds first_name, last_name, relationship, status enum, updated_at to residents.
-- Preserves backward compatibility by keeping old columns temporarily.
-- ============================================================

-- =====================  PROPERTIES  ==========================

-- Add new columns
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS address_line1   text,
  ADD COLUMN IF NOT EXISTS address_line2   text,
  ADD COLUMN IF NOT EXISTS country         text DEFAULT 'USA',
  ADD COLUMN IF NOT EXISTS property_type   text DEFAULT 'Single Family',
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();

-- Migrate existing data: populate address_line1 from address
UPDATE properties SET address_line1 = address WHERE address_line1 IS NULL;
UPDATE properties SET address_line2 = unit WHERE address_line2 IS NULL AND unit IS NOT NULL;

-- Add check constraint on property_type
ALTER TABLE properties
  ADD CONSTRAINT chk_property_type
  CHECK (property_type IN ('Single Family', 'Townhouse', 'Condo', 'Apartment', 'Other'));

-- =====================  RESIDENTS  ===========================

-- Add new columns
ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS first_name    text,
  ADD COLUMN IF NOT EXISTS last_name     text,
  ADD COLUMN IF NOT EXISTS relationship  text DEFAULT 'Primary Owner',
  ADD COLUMN IF NOT EXISTS status        text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

-- Add check constraints
ALTER TABLE residents
  ADD CONSTRAINT chk_resident_status
  CHECK (status IN ('active', 'former'));

ALTER TABLE residents
  ADD CONSTRAINT chk_resident_relationship
  CHECK (relationship IN ('Primary Owner', 'Co-Owner', 'Spouse', 'Tenant', 'Other'));

-- Migrate existing data: split full_name into first/last, map type to relationship, map is_current to status
UPDATE residents SET
  first_name = split_part(full_name, ' ', 1),
  last_name  = CASE
    WHEN position(' ' in full_name) > 0
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;

UPDATE residents SET
  relationship = CASE type
    WHEN 'owner'    THEN 'Primary Owner'
    WHEN 'co-owner' THEN 'Co-Owner'
    WHEN 'tenant'   THEN 'Tenant'
    ELSE 'Primary Owner'
  END
WHERE relationship = 'Primary Owner' AND type IS NOT NULL AND type != 'owner';

UPDATE residents SET
  status = CASE WHEN is_current = true THEN 'active' ELSE 'former' END
WHERE status = 'active' AND is_current = false;

-- Add index on residents(status) for fast current/former filtering
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents (status);

-- =====================  TRIGGERS  ============================

-- Auto-update updated_at on properties
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
