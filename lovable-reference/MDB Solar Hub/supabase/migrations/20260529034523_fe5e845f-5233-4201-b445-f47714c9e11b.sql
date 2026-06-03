
CREATE TABLE public.solar_design_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID,
  proposal_id UUID,
  design_name TEXT,
  view_type TEXT,
  roof_image_url TEXT,
  layout_image_url TEXT,
  panel_count INTEGER,
  system_size_kw NUMERIC,
  azimuth NUMERIC,
  tilt NUMERIC,
  irradiance_score NUMERIC,
  shade_risk TEXT,
  equipment_summary JSONB,
  layout_json JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_design_layouts TO authenticated;
GRANT ALL ON public.solar_design_layouts TO service_role;
ALTER TABLE public.solar_design_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Design layouts select by auth" ON public.solar_design_layouts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Design layouts insert by auth" ON public.solar_design_layouts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Design layouts update by auth" ON public.solar_design_layouts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Design layouts delete by auth" ON public.solar_design_layouts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER set_updated_at_solar_design_layouts BEFORE UPDATE ON public.solar_design_layouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.solar_design_panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_layout_id UUID NOT NULL,
  panel_brand TEXT,
  panel_model TEXT,
  wattage INTEGER,
  x_position NUMERIC,
  y_position NUMERIC,
  rotation NUMERIC,
  orientation TEXT,
  roof_plane TEXT,
  azimuth NUMERIC,
  tilt NUMERIC,
  microinverter_model TEXT,
  string_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_design_panels TO authenticated;
GRANT ALL ON public.solar_design_panels TO service_role;
ALTER TABLE public.solar_design_panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Design panels select by auth" ON public.solar_design_panels FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Design panels insert by auth" ON public.solar_design_panels FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Design panels update by auth" ON public.solar_design_panels FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Design panels delete by auth" ON public.solar_design_panels FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER set_updated_at_solar_design_panels BEFORE UPDATE ON public.solar_design_panels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.solar_design_obstructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_layout_id UUID NOT NULL,
  obstruction_type TEXT,
  x_position NUMERIC,
  y_position NUMERIC,
  width NUMERIC,
  height NUMERIC,
  shade_impact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_design_obstructions TO authenticated;
GRANT ALL ON public.solar_design_obstructions TO service_role;
ALTER TABLE public.solar_design_obstructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Design obstructions select by auth" ON public.solar_design_obstructions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Design obstructions insert by auth" ON public.solar_design_obstructions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Design obstructions update by auth" ON public.solar_design_obstructions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Design obstructions delete by auth" ON public.solar_design_obstructions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE TRIGGER set_updated_at_solar_design_obstructions BEFORE UPDATE ON public.solar_design_obstructions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
