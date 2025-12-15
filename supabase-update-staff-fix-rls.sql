-- =====================================================
-- UPDATE FOR STAFF MANAGEMENT (FIXED RLS & CASE SENSITIVITY)
-- =====================================================

-- 1. FIX RLS POLICY FOR VIEWING STAFF
-- Previously, users could only view their OWN profile.
-- We need to allow viewing ALL users in the same tenant.

DROP POLICY IF EXISTS "Users can view tenant users" ON users;

CREATE POLICY "Users can view tenant users" ON users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- 2. UPDATE Trigger Function to handle invitations (Case Insensitive)
CREATE OR REPLACE FUNCTION public.create_tenant_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
    invitation_record RECORD;
BEGIN
    -- Check if there is an invitation for this email (CASE INSENSITIVE)
    SELECT * INTO invitation_record FROM public.invitations WHERE LOWER(email) = LOWER(NEW.email);

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
        DELETE FROM public.invitations WHERE LOWER(email) = LOWER(NEW.email);

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
