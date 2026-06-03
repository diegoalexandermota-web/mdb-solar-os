CREATE TABLE public.financing_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid,
  lead_id uuid,
  program_type text NOT NULL,
  provider text NOT NULL,
  scenario_name text NOT NULL,
  monthly_payment numeric,
  down_payment numeric,
  term_years integer,
  apr numeric,
  dealer_fee numeric,
  escalator numeric,
  estimated_remaining_utility_bill numeric,
  estimated_monthly_savings numeric,
  estimated_25_year_cost numeric,
  estimated_25_year_savings numeric,
  ownership_type text,
  maintenance_included boolean DEFAULT false,
  tax_credit_eligible boolean DEFAULT false,
  transferability_notes text,
  qualification_notes text,
  internal_notes text,
  is_recommended boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financing_scenarios TO authenticated;
GRANT ALL ON public.financing_scenarios TO service_role;

ALTER TABLE public.financing_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financing scenarios select by auth"
ON public.financing_scenarios FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financing scenarios insert by auth"
ON public.financing_scenarios FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Financing scenarios update by auth"
ON public.financing_scenarios FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financing scenarios delete by auth"
ON public.financing_scenarios FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_financing_scenarios_lead ON public.financing_scenarios(lead_id);
CREATE INDEX idx_financing_scenarios_proposal ON public.financing_scenarios(proposal_id);

CREATE TRIGGER update_financing_scenarios_updated_at
BEFORE UPDATE ON public.financing_scenarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();