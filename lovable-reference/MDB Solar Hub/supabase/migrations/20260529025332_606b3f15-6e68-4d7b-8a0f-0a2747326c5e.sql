
CREATE TABLE IF NOT EXISTS public.solar_design_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  proposal_id uuid,
  annual_usage_kwh numeric,
  monthly_usage_kwh numeric,
  utility_rate_assumption numeric,
  desired_offset_percent numeric,
  system_size_kw numeric,
  panel_wattage integer,
  panel_count integer,
  estimated_annual_production_kwh numeric,
  estimated_monthly_production_kwh numeric,
  recommended_financing text,
  design_confidence text,
  roof_type text,
  roof_condition text,
  roof_notes text,
  risk_flags jsonb,
  proposal_notes text,
  requires_final_design boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solar_design_estimates TO authenticated;
GRANT ALL ON public.solar_design_estimates TO service_role;

ALTER TABLE public.solar_design_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solar estimates select by auth"
ON public.solar_design_estimates FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solar estimates insert by auth"
ON public.solar_design_estimates FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Solar estimates update by auth"
ON public.solar_design_estimates FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Solar estimates delete by auth"
ON public.solar_design_estimates FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_solar_estimates_updated_at
BEFORE UPDATE ON public.solar_design_estimates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.utility_usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  kwh_usage numeric,
  bill_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.utility_usage_records TO authenticated;
GRANT ALL ON public.utility_usage_records TO service_role;

ALTER TABLE public.utility_usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utility usage select by auth"
ON public.utility_usage_records FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Utility usage insert by auth"
ON public.utility_usage_records FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Utility usage update by auth"
ON public.utility_usage_records FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Utility usage delete by auth"
ON public.utility_usage_records FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_utility_usage_updated_at
BEFORE UPDATE ON public.utility_usage_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
