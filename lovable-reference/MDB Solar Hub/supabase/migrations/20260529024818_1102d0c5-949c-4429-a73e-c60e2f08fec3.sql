
-- Add missing columns the proposal builder needs
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS estimated_25_year_cost numeric,
  ADD COLUMN IF NOT EXISTS estimated_25_year_savings numeric,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add permissive MVP policies for authenticated users (mirrors leads table pattern)
DROP POLICY IF EXISTS "MVP authenticated select proposals" ON public.proposals;
DROP POLICY IF EXISTS "MVP authenticated insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "MVP authenticated update proposals" ON public.proposals;
DROP POLICY IF EXISTS "MVP authenticated delete proposals" ON public.proposals;

CREATE POLICY "MVP authenticated select proposals"
ON public.proposals FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "MVP authenticated insert proposals"
ON public.proposals FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "MVP authenticated update proposals"
ON public.proposals FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "MVP authenticated delete proposals"
ON public.proposals FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);

-- Ensure data API grants are in place
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
