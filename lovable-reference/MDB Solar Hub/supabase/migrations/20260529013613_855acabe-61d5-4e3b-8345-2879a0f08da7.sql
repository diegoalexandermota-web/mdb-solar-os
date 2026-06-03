
-- MVP: allow any authenticated user full access to leads
DROP POLICY IF EXISTS "MVP authenticated select leads" ON public.leads;
DROP POLICY IF EXISTS "MVP authenticated insert leads" ON public.leads;
DROP POLICY IF EXISTS "MVP authenticated update leads" ON public.leads;
DROP POLICY IF EXISTS "MVP authenticated delete leads" ON public.leads;

CREATE POLICY "MVP authenticated select leads"
ON public.leads FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "MVP authenticated insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "MVP authenticated update leads"
ON public.leads FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "MVP authenticated delete leads"
ON public.leads FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);
