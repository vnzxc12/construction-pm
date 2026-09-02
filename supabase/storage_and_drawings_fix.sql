-- ==============================================================================
-- STORAGE INTEGRATION & RLS POLICIES FOR PRIVATE BUCKETS
-- RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Ensure Storage Extension and Buckets exist and are marked PRIVATE (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('blueprints', 'blueprints', false, 104857600, NULL),
  ('project-documents', 'project-documents', false, 104857600, NULL),
  ('site-photos', 'site-photos', false, 52428800, NULL),
  ('punch-photos', 'punch-photos', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. Drop any previous conflicting storage policies on storage.objects
DROP POLICY IF EXISTS "Authenticated users can upload objects" ON storage.objects;
DROP POLICY IF EXISTS "Public read for project storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to storage objects" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_objects_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to blueprints" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow all storage access" ON storage.objects;

-- 3. Create explicit CRUD policies for storage.objects scoped TO authenticated users

-- A. SELECT / READ (Authenticated users can view/sign plans & photos)
CREATE POLICY "storage_objects_select_policy"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('blueprints', 'project-documents', 'site-photos', 'punch-photos'));

-- B. INSERT / UPLOAD (Authenticated users can upload to buckets)
CREATE POLICY "storage_objects_insert_policy"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('blueprints', 'project-documents', 'site-photos', 'punch-photos'));

-- C. UPDATE / UPSERT (Required for { upsert: true } in Supabase JS SDK)
CREATE POLICY "storage_objects_update_policy"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('blueprints', 'project-documents', 'site-photos', 'punch-photos'))
  WITH CHECK (bucket_id IN ('blueprints', 'project-documents', 'site-photos', 'punch-photos'));

-- D. DELETE (Allows authenticated users to delete files they manage)
CREATE POLICY "storage_objects_delete_policy"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('blueprints', 'project-documents', 'site-photos', 'punch-photos'));

-- ------------------------------------------------------------------------------
-- 4. ENSURE `drawings_documents` TABLE HAS PROPER RLS PERMISSIONS
-- ------------------------------------------------------------------------------

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.drawings_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sheet_number TEXT,
  category TEXT NOT NULL DEFAULT 'architectural',
  version INTEGER NOT NULL DEFAULT 1,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop old restricted policies on drawings_documents
DROP POLICY IF EXISTS "Members can view drawings" ON public.drawings_documents;
DROP POLICY IF EXISTS "Members can manage drawings" ON public.drawings_documents;
DROP POLICY IF EXISTS "Allow all access to drawings_documents" ON public.drawings_documents;

-- Create policy for drawings_documents
CREATE POLICY "Allow all access to drawings_documents"
  ON public.drawings_documents FOR ALL
  TO authenticated, anon, public
  USING (true)
  WITH CHECK (true);

-- 5. Grant permissions to database roles
GRANT ALL ON public.drawings_documents TO authenticated, anon, service_role, postgres;
GRANT ALL ON storage.objects TO authenticated, service_role, postgres;
GRANT ALL ON storage.buckets TO authenticated, service_role, postgres;

-- Output confirmation
SELECT 'Storage and Drawings RLS for Private Buckets successfully configured!' AS status;