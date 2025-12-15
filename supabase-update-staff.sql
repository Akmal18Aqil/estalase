-- =====================================================
-- UPDATE FOR STAFF MANAGEMENT (REVISED)
-- =====================================================

-- 1. Create INVITATIONS table (if not exists)
CREATE TABLE IF NOT EXISTS invitations (
    email VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRITICAL: Grant permissions to authenticated users to access this table
GRANT ALL ON invitations TO authenticated;
GRANT ALL ON invitations TO service_role;

-- Enable RLS for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors when re-running
DROP POLICY IF EXISTS "Owners can view tenant invitations" ON invitations;
DROP POLICY IF EXISTS "Owners can insert tenant invitations" ON invitations;
DROP POLICY IF EXISTS "Owners can delete tenant invitations" ON invitations;

-- RLS: Owners can view/insert/delete invitations for their tenant
CREATE POLICY "Owners can view tenant invitations" ON invitations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can insert tenant invitations" ON invitations
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can delete tenant invitations" ON invitations
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'
        )
    );

-- 2. UPDATE Trigger Function to handle invitations
CREATE OR REPLACE FUNCTION public.create_tenant_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
    invitation_record RECORD;
BEGIN
    -- Check if there is an invitation for this email
    SELECT * INTO invitation_record FROM public.invitations WHERE email = NEW.email;

    IF invitation_record IS NOT NULL THEN
        -- USER IS INVITED: Join existing tenant
        
        -- Create user profile linked to invited tenant
        INSERT INTO public.users (auth_id, tenant_id, name, email, role)
        VALUES (
            NEW.id, 
            invitation_record.tenant_id, 
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
            NEW.email, 
            'staff' -- Force role to staff (or use invitation_record.role)
        )
        RETURNING id INTO new_user_id;

        -- Create tenant membership
        INSERT INTO public.tenant_members (tenant_id, user_id, role)
        VALUES (invitation_record.tenant_id, new_user_id, 'staff');

        -- Delete the invitation (it's one-time use)
        DELETE FROM public.invitations WHERE email = NEW.email;

    ELSE
        -- USER IS NEW OWNER: Create new tenant (Existing Logic)
        
        -- Create new tenant
        INSERT INTO public.tenants (name, owner_id)
        VALUES ('Toko Baru', NULL)
        RETURNING id INTO new_tenant_id;
        
        -- Create user profile
        INSERT INTO public.users (auth_id, tenant_id, name, email, role)
        VALUES (NEW.id, new_tenant_id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email, 'owner')
        RETURNING id INTO new_user_id;
        
        -- Update tenant owner
        UPDATE public.tenants SET owner_id = new_user_id WHERE id = new_tenant_id;
        
        -- Create tenant membership
        INSERT INTO public.tenant_members (tenant_id, user_id, role)
        VALUES (new_tenant_id, new_user_id, 'owner');
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
