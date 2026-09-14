-- Phone numbers for match coordination; Venice / subscription communities

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles (phone_number)
  WHERE phone_number IS NOT NULL;
