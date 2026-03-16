-- Fix RLS for delete operations
-- Ensure car_permissions has proper RLS for delete

-- Enable RLS if not already
ALTER TABLE car_permissions ENABLE ROW LEVEL SECURITY;

-- Allow users with any permission to delete their own permission records
DROP POLICY IF EXISTS "Users can delete their own car permissions" ON car_permissions;
CREATE POLICY "Users can delete their own car permissions" ON car_permissions
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Ensure cars RLS allows owners to delete
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS " Owners can delete their cars" ON cars;
CREATE POLICY "Owners can delete their cars" ON cars
FOR DELETE TO authenticated
USING (
  id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid() AND role = 'owner')
);

-- Service records delete
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete service records on cars they have access to" ON service_records;
CREATE POLICY "Users can delete service records on cars they have access to" ON service_records
FOR DELETE TO authenticated
USING (car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid()));

-- Reminders delete
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete reminders on cars they have access to" ON reminders;
CREATE POLICY "Users can delete reminders on cars they have access to" ON reminders
FOR DELETE TO authenticated
USING (car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid()));

-- Ownership transfers delete
ALTER TABLE ownership_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete transfers on cars they own" ON ownership_transfers;
CREATE POLICY "Users can delete transfers on cars they own" ON ownership_transfers
FOR DELETE TO authenticated
USING (car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid() AND role = 'owner'));