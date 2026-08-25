-- ==============================================================================
-- BUILDPULSE - CONSTRUCTION PROJECT MANAGEMENT DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL, Row Level Security (RLS) & Supabase Storage
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ------------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'admin',
  'project_manager',
  'superintendent',
  'subcontractor',
  'client',
  'safety_officer'
);

CREATE TYPE project_status AS ENUM (
  'planning',
  'bidding',
  'in_progress',
  'on_hold',
  'completed',
  'archived'
);

CREATE TYPE task_status AS ENUM (
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE rfi_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'answered',
  'closed'
);

CREATE TYPE punch_status AS ENUM (
  'open',
  'ready_for_inspection',
  'in_review',
  'approved',
  'rejected'
);

CREATE TYPE punch_severity AS ENUM (
  'cosmetic',
  'minor',
  'major',
  'critical_safety'
);

CREATE TYPE change_order_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'void'
);

CREATE TYPE doc_category AS ENUM (
  'architectural',
  'structural',
  'mep',
  'civil',
  'specifications',
  'permits',
  'contracts',
  'safety'
);

-- ------------------------------------------------------------------------------
-- 2. CORE TABLES
-- ------------------------------------------------------------------------------

-- User Profiles (Linked with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'project_manager',
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE, -- e.g. "PRJ-2026-001"
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  spent NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Members (Many-to-many relationship with custom project role)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'subcontractor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Tasks & Scheduling
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  trade_category TEXT, -- e.g. "Electrical", "Plumbing", "Framing"
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Field Logs / Site Reports
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  weather_condition TEXT, -- "Sunny", "Rain", "Windy", "Snow"
  temp_high NUMERIC(5, 2),
  temp_low NUMERIC(5, 2),
  site_conditions TEXT,
  work_performed TEXT NOT NULL,
  delays_notes TEXT,
  safety_incidents TEXT,
  visitors_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, log_date)
);

-- Daily Log Crew / Labor Counts
CREATE TABLE IF NOT EXISTS daily_log_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  trade TEXT NOT NULL, -- "Carpentry", "HVAC", "Concrete"
  worker_count INTEGER NOT NULL DEFAULT 1,
  hours_worked NUMERIC(5, 2) NOT NULL DEFAULT 8.00
);

-- Drawings, Blueprints & Documents
CREATE TABLE IF NOT EXISTS drawings_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sheet_number TEXT, -- e.g. "A-101", "S-202", "M-001"
  category doc_category NOT NULL DEFAULT 'architectural',
  version INTEGER NOT NULL DEFAULT 1,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Requests For Information (RFIs)
CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfi_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  suggested_solution TEXT,
  status rfi_status NOT NULL DEFAULT 'submitted',
  impact_cost BOOLEAN NOT NULL DEFAULT FALSE,
  impact_days INTEGER DEFAULT 0,
  cost_estimate NUMERIC(15, 2) DEFAULT 0.00,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  official_answer TEXT,
  answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, rfi_number)
);

-- Punch List & Site Inspection Items
CREATE TABLE IF NOT EXISTS punch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL, -- e.g. "Floor 2 - Room 204", "North Exterior Wall"
  status punch_status NOT NULL DEFAULT 'open',
  severity punch_severity NOT NULL DEFAULT 'minor',
  trade TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, item_number)
);

-- Change Orders (Financial adjustments)
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status change_order_status NOT NULL DEFAULT 'draft',
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  schedule_impact_days INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, co_number)
);

-- Budget Line Items
CREATE TABLE IF NOT EXISTS budget_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cost_code TEXT NOT NULL, -- e.g. "03-3000 Cast-in-Place Concrete"
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  original_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  approved_changes NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  committed_costs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  actual_spent NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is member of project
CREATE OR REPLACE FUNCTION is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_id AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can read profiles, update own profile
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: Project members & creators can view and edit
CREATE POLICY "Project members can view projects"
  ON projects FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_project_member(id));

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project managers can update projects"
  ON projects FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR is_project_member(id));

-- Project Members: Project members can view team
CREATE POLICY "Project team visible to members"
  ON project_members FOR SELECT TO authenticated
  USING (is_project_member(project_id));

CREATE POLICY "Managers can manage team members"
  ON project_members FOR ALL TO authenticated
  USING (is_project_member(project_id));

-- Tasks: Project members can view and update
CREATE POLICY "Members can view tasks"
  ON tasks FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can insert/update tasks"
  ON tasks FOR ALL TO authenticated USING (is_project_member(project_id));

-- Daily Logs: Project members can view and create
CREATE POLICY "Members can view daily logs"
  ON daily_logs FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage daily logs"
  ON daily_logs FOR ALL TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage log crews"
  ON daily_log_crews FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM daily_logs WHERE id = daily_log_crews.daily_log_id AND is_project_member(daily_logs.project_id)
  ));

-- Drawings & Documents: Project members can view and upload
CREATE POLICY "Members can view drawings"
  ON drawings_documents FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage drawings"
  ON drawings_documents FOR ALL TO authenticated USING (is_project_member(project_id));

-- RFIs: Project members can view and create
CREATE POLICY "Members can view RFIs"
  ON rfis FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage RFIs"
  ON rfis FOR ALL TO authenticated USING (is_project_member(project_id));

-- Punch Items: Project members can view and manage
CREATE POLICY "Members can view punch items"
  ON punch_items FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage punch items"
  ON punch_items FOR ALL TO authenticated USING (is_project_member(project_id));

-- Change Orders & Budget: Project members can view
CREATE POLICY "Members can view change orders"
  ON change_orders FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage change orders"
  ON change_orders FOR ALL TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can view budget"
  ON budget_line_items FOR SELECT TO authenticated USING (is_project_member(project_id));

CREATE POLICY "Members can manage budget"
  ON budget_line_items FOR ALL TO authenticated USING (is_project_member(project_id));

-- ------------------------------------------------------------------------------
-- 4. AUTOMATIC USER PROFILE TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'project_manager'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. STORAGE BUCKETS SETUP (Run in Supabase SQL Editor)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('project-documents', 'project-documents', true),
  ('blueprints', 'blueprints', true),
  ('site-photos', 'site-photos', true),
  ('punch-photos', 'punch-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow authenticated users to upload and view
CREATE POLICY "Authenticated users can upload objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('project-documents', 'blueprints', 'site-photos', 'punch-photos'));

CREATE POLICY "Public read for project storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('project-documents', 'blueprints', 'site-photos', 'punch-photos'));
