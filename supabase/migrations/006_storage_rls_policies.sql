-- Storage RLS Policies for vehicle-files bucket
-- Only car owners can upload/manage files for their cars

-- Allow owners to upload files to their car's folder
CREATE POLICY "Owners can upload vehicle files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT car_id::text FROM car_permissions WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Allow owners to view their car files
CREATE POLICY "Owners can view vehicle files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'vehicle-files'
  AND (storage.foldername(name))[1] IN (
    SELECT car_id::text FROM car_permissions WHERE user_id = auth.uid()
  )
);

-- Allow owners to update/delete their car files
CREATE POLICY "Owners can update vehicle files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'vehicle-files'
  AND (storage.foldername(name))[1] IN (
    SELECT car_id::text FROM car_permissions WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Allow owners to delete their car files
CREATE POLICY "Owners can delete vehicle files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'vehicle-files'
  AND (storage.foldername(name))[1] IN (
    SELECT car_id::text FROM car_permissions WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Allow public read access for viewing vehicles (e.g., transfer acceptance pages)
-- But restrict write to owners only (covered by policies above)