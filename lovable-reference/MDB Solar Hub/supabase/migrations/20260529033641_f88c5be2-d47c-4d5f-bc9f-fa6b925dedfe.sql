
DROP POLICY IF EXISTS "Solar previews public read" ON storage.objects;
CREATE POLICY "Solar previews auth read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'solar-previews');
