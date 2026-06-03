
-- lead_documents table
CREATE TABLE public.lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_path text,
  file_size bigint,
  status text NOT NULL DEFAULT 'Received',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_documents TO authenticated;
GRANT ALL ON public.lead_documents TO service_role;

ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead documents select by auth"
  ON public.lead_documents FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Lead documents insert by auth"
  ON public.lead_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Lead documents update by auth"
  ON public.lead_documents FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Lead documents delete by auth"
  ON public.lead_documents FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_lead_documents_updated_at
  BEFORE UPDATE ON public.lead_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lead_documents_lead_id ON public.lead_documents(lead_id);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-documents', 'lead-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth can view lead-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lead-documents');
CREATE POLICY "Auth can upload lead-documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-documents');
CREATE POLICY "Auth can update lead-documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lead-documents');
CREATE POLICY "Auth can delete lead-documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lead-documents');
