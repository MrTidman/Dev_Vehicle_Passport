-- Add token_expires_at column to ownership_transfers
ALTER TABLE ownership_transfers ADD COLUMN token_expires_at TIMESTAMPTZ;

-- Set expiration on existing pending transfers (48 hours from now for new ones)
-- This will be set in application code for new transfers

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_token_expires ON ownership_transfers(token_expires_at);