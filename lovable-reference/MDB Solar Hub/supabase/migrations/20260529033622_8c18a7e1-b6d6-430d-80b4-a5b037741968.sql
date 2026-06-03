
CREATE TABLE public.solar_visual_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  proposal_id uuid,
  original_image_url text,
  generated_preview_url text,
  confidence_level text,
  view_type text,
  panel_count integer,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_visual_previews TO authenticated;
GRANT ALL ON public.solar_visual_previews TO service_role;

ALTER TABLE public.solar_visual_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visual previews select by auth" ON public.solar_visual_previews
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Visual previews insert by auth" ON public.solar_visual_previews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Visual previews update by auth" ON public.solar_visual_previews
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Visual previews delete by auth" ON public.solar_visual_previews
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_solar_visual_previews_updated_at
  BEFORE UPDATE ON public.solar_visual_previews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('solar-previews', 'solar-previews', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Solar previews public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'solar-previews');

CREATE POLICY "Solar previews auth insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'solar-previews');

CREATE POLICY "Solar previews auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'solar-previews');

CREATE POLICY "Solar previews auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'solar-previews');
