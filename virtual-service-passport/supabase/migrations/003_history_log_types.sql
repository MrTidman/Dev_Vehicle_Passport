-- Add entry_type column to note_journal for new history log types
ALTER TABLE note_journal ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'NOTE';

-- Add a new column for storing reference IDs (like to service_records or reminders)
ALTER TABLE note_journal ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Add a new column for attachments (receipt URLs, etc.)
ALTER TABLE note_journal ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Update RLS policies to allow all permission types to view history
DROP POLICY IF EXISTS "Note journal owners can view" ON note_journal;

CREATE POLICY "Note journal viewers can view" ON note_journal FOR SELECT
TO authenticated
USING (car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid()));

-- Rename insert policy to reflect it's not just for owners anymore
DROP POLICY IF EXISTS "Note journal owners can insert" ON note_journal;

CREATE POLICY "Note journal can insert" ON note_journal FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND 
  car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid() AND role IN ('owner', 'mechanic'))
);