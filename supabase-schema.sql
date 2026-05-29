-- AI Logs
create table ai_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  action text,
  context jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- AI Messages
create table ai_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  role text,
  message text,
  context jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- AI Recommendations
create table ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  lead_id uuid references leads(id),
  proposal_id uuid references proposals(id),
  recommendation text,
  type text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
-- Supabase schema for MDB Solar OS

-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Leads
create table leads (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id),
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  utility_company text,
  service_type text,
  assigned_rep uuid references profiles(id),
  pipeline_stage text default 'New Lead',
  priority text,
  archived boolean default false,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone
);

-- Tasks
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id),
  owner_id uuid references profiles(id),
  title text not null,
  description text,
  due_date date,
  due_time text,
  priority text,
  type text,
  assigned_to uuid references profiles(id),
  completed boolean default false,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id),
  name text not null,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Commissions
create table commissions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id),
  amount numeric,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Proposals
create table proposals (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id),
  project_id uuid references projects(id),
  customer_name text,
  address text,
  utility_company text,
  monthly_bill numeric,
  annual_usage numeric,
  financing_preference text,
  solar_estimate_id uuid references solar_design_estimates(id),
  status text default 'Draft',
  archived boolean default false,
  ai_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone
);

-- Financing Scenarios
create table financing_scenarios (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid references proposals(id),
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Solar Design Estimates
create table solar_design_estimates (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  estimate jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Solar Visual Previews
create table solar_visual_previews (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  preview_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Solar Design Layouts
create table solar_design_layouts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  layout jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Solar Design Panels
create table solar_design_panels (
  id uuid primary key default uuid_generate_v4(),
  layout_id uuid references solar_design_layouts(id),
  panel jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Solar Design Obstructions
create table solar_design_obstructions (
  id uuid primary key default uuid_generate_v4(),
  layout_id uuid references solar_design_layouts(id),
  obstruction jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
