-- Add shortcode column to cars table
ALTER TABLE cars ADD COLUMN shortcode VARCHAR(8) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_shortcode ON cars(shortcode);