-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICY
-- =====================================================

-- 1. Create a helper function to get current user's tenant_id safely
-- usage of SECURITY DEFINER allows this function to bypass RLS when querying users table
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view tenant users" ON users;

-- 3. Create the new optimized policy
CREATE POLICY "Users can view tenant users" ON users
    FOR SELECT USING (
        -- Allow if the row's tenant_id matches the current user's tenant_id
        tenant_id = get_auth_tenant_id()
    );

-- Note: We also need to ensure users can view their OWN profile even if they don't have a tenant yet (edge case)
-- So we keep or re-ensure the basic "view own profile" policy exists.
-- (It likely already exists as "Users can view own profile", but purely for redundancy if needed)

-- The existing "Users can view own profile" policy (auth_id = auth.uid()) 
-- is good, but Supabase combines policies with OR. 
-- So "Same Tenant" OR "Own Profile" covers everything.
