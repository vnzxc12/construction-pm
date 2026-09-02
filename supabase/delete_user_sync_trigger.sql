-- ==============================================================================
-- USER SYNCHRONIZATION & AUTO-DELETE TRIGGER
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Purge any orphaned users in auth.users who no longer exist in public.profiles
-- (This immediately cleans up the deleted 'test' user credentials from Supabase Auth)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Create trigger function to automatically delete from auth.users when profile is deleted
CREATE OR REPLACE FUNCTION public.handle_profile_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- 3. Attach trigger to public.profiles
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_deleted();

-- 4. Confirm execution
SELECT 'User synchronization trigger installed and orphaned auth accounts purged!' AS status;