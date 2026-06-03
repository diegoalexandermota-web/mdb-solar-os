
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'sales_rep', 'operations', 'customer');
CREATE TYPE public.lead_stage AS ENUM (
  'New Lead','Contacted','Appointment Set','Proposal Sent','Credit Approved',
  'Contract Signed','Site Survey','Permit','Install Scheduled','Installed','PTO','Commission Paid'
);
CREATE TYPE public.lead_priority AS ENUM ('High','Medium','Low');
CREATE TYPE public.task_status AS ENUM ('open','in_progress','done');
CREATE TYPE public.commission_status AS ENUM ('Pending','Approved','Paid','Hold');
CREATE TYPE public.commission_milestone AS ENUM ('Contract','NTP','Install','PTO','Paid');
CREATE TYPE public.proposal_status AS ENUM ('Draft','Sent','Viewed','Accepted','Declined');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role SECURITY DEFINER (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'FL',
  service_type TEXT,
  utility_company TEXT,
  monthly_bill NUMERIC,
  credit_score_range TEXT,
  lead_source TEXT,
  assigned_rep UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pipeline_stage public.lead_stage NOT NULL DEFAULT 'New Lead',
  priority public.lead_priority NOT NULL DEFAULT 'Medium',
  notes TEXT,
  next_follow_up_date DATE,
  last_contact_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leads_assigned_rep ON public.leads(assigned_rep);
CREATE INDEX idx_leads_stage ON public.leads(pipeline_stage);

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority public.lead_priority NOT NULL DEFAULT 'Medium',
  status public.task_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_name TEXT,
  service_type TEXT,
  project_stage TEXT,
  system_size_kw NUMERIC,
  panel_count INT,
  permit_number TEXT,
  crew TEXT,
  inspection_date DATE,
  pto_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============ COMMISSIONS ============
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rep_name TEXT,
  customer_name TEXT,
  service_type TEXT,
  deal_value NUMERIC,
  commission_amount NUMERIC,
  milestone public.commission_milestone NOT NULL DEFAULT 'Contract',
  status public.commission_status NOT NULL DEFAULT 'Pending',
  expected_payout_date DATE,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- ============ PROPOSALS ============
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  customer_name TEXT,
  address TEXT,
  utility_company TEXT,
  monthly_bill NUMERIC,
  estimated_system_size_kw NUMERIC,
  estimated_panels INT,
  estimated_payment NUMERIC,
  estimated_monthly_savings NUMERIC,
  lease_option BOOLEAN DEFAULT false,
  loan_option BOOLEAN DEFAULT true,
  water_add_on BOOLEAN DEFAULT false,
  roof_hvac_add_on BOOLEAN DEFAULT false,
  battery_add_on BOOLEAN DEFAULT false,
  proposal_status public.proposal_status NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- ============ updated_at triggers ============
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_commissions_updated BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ handle_new_user trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- leads
CREATE POLICY "Leads view by role" ON public.leads FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'operations') OR
  (public.has_role(auth.uid(), 'sales_rep') AND assigned_rep = auth.uid())
);
CREATE POLICY "Leads insert by authenticated" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Leads update by role" ON public.leads FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  (public.has_role(auth.uid(), 'sales_rep') AND assigned_rep = auth.uid())
);
CREATE POLICY "Leads delete by admin/manager" ON public.leads FOR DELETE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- tasks
CREATE POLICY "Tasks view by role" ON public.tasks FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'operations') OR
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_rep = auth.uid())
);
CREATE POLICY "Tasks insert by authenticated" ON public.tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Tasks update by role" ON public.tasks FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_rep = auth.uid())
);
CREATE POLICY "Tasks delete by admin/manager" ON public.tasks FOR DELETE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- projects
CREATE POLICY "Projects view by role" ON public.projects FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'operations') OR
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_rep = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.leads l JOIN public.profiles p ON p.email = l.email WHERE l.id = lead_id AND p.user_id = auth.uid())
);
CREATE POLICY "Projects insert by mgmt" ON public.projects FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operations')
);
CREATE POLICY "Projects update by mgmt" ON public.projects FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'operations')
);
CREATE POLICY "Projects delete by admin" ON public.projects FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- commissions
CREATE POLICY "Commissions view by role" ON public.commissions FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  rep_id = auth.uid()
);
CREATE POLICY "Commissions insert by mgmt" ON public.commissions FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);
CREATE POLICY "Commissions update by mgmt" ON public.commissions FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);
CREATE POLICY "Commissions delete by admin" ON public.commissions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- proposals
CREATE POLICY "Proposals view by role" ON public.proposals FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_rep = auth.uid())
);
CREATE POLICY "Proposals insert by authenticated" ON public.proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Proposals update by role" ON public.proposals FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_rep = auth.uid())
);
CREATE POLICY "Proposals delete by admin/manager" ON public.proposals FOR DELETE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);
