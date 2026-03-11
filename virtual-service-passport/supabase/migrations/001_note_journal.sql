-- Create note_journal table for tracking note changes
CREATE TABLE IF NOT EXISTS note_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE note_journal ENABLE ROW LEVEL SECURITY;

-- Policy: car owners can view their car's note history
CREATE POLICY "Note journal owners can view" ON note_journal FOR SELECT
TO authenticated
USING (car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid()));

-- Policy: owners can insert note history
CREATE POLICY "Note journal owners can insert" ON note_journal FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());