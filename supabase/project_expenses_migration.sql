-- ==============================================================================
-- FIX: project_expenses Table & Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. Ensure the table exists
CREATE TABLE IF NOT EXISTS public.project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Labor / Payroll',
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_to TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing restrictive policies
DROP POLICY IF EXISTS "Members can view project expenses" ON public.project_expenses;
DROP POLICY IF EXISTS "Members can manage project expenses" ON public.project_expenses;
DROP POLICY IF EXISTS "Allow all access to project_expenses" ON public.project_expenses;

-- 4. Create permissive policies for authenticated and anon users
CREATE POLICY "Allow all access to project_expenses"
  ON public.project_expenses
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 5. Grant full table permissions
GRANT ALL ON public.project_expenses TO authenticated, anon, service_role;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON public.project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_payment_date ON public.project_expenses(payment_date DESC);
