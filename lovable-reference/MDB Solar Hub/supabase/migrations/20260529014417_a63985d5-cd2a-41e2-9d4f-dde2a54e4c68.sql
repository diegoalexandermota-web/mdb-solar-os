
-- Lead activity timeline
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  actor_id uuid,
  actor_name text,
  activity_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activities select by auth"
ON public.lead_activities FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Activities insert by auth"
ON public.lead_activities FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id, created_at DESC);

-- Lead notes
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  author_id uuid,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes select by auth"
ON public.lead_notes FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Notes insert by auth"
ON public.lead_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (author_id = auth.uid() OR author_id IS NULL));

CREATE POLICY "Notes update by author or admin"
ON public.lead_notes FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Notes delete by author or admin"
ON public.lead_notes FOR DELETE TO authenticated
USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id, created_at DESC);

CREATE TRIGGER set_lead_notes_updated_at
BEFORE UPDATE ON public.lead_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keep leads.updated_at fresh on any update
CREATE TRIGGER set_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
