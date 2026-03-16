-- Add vin_last6 column to cars table for masked VIN storage
-- This allows displaying VIN as "*****ABC123" while keeping full VIN for transfers

-- Step 1: Add the new column
ALTER TABLE cars ADD COLUMN vin_last6 VARCHAR(6);

-- Step 2: Populate existing records with last 6 characters of VIN
UPDATE cars SET vin_last6 = UPPER(RIGHT(vin, 6)) WHERE vin IS NOT NULL;

-- Step 3: Create index for potential lookups (optional, but useful)
CREATE INDEX IF NOT EXISTS idx_cars_vin_last6 ON cars(vin_last6);

-- Note: The 'vin' column is kept for:
-- - Ownership transfers (full VIN needed)
-- - Existing data compatibility
-- Future migration could move full VIN to a separate secure table if needed