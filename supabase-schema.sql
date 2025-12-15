-- =====================================================
-- SaaS POS UMKM Multi-Tenant Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extended profile from auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID, -- FK added via ALTER TABLE
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table (store/UMKM data)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    owner_id UUID, -- FK added via ALTER TABLE
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add circular Foreign Keys
ALTER TABLE users 
    ADD CONSTRAINT fk_users_tenant 
    FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) 
    ON DELETE CASCADE;

ALTER TABLE tenants 
    ADD CONSTRAINT fk_tenants_owner 
    FOREIGN KEY (owner_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- Tenant members (for multi-user per tenant)
CREATE TABLE tenant_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- =====================================================
-- PRODUCT MANAGEMENT
-- =====================================================

-- Product categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    buy_price DECIMAL(12,2) DEFAULT 0,
    sell_price DECIMAL(12,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SALES & TRANSACTIONS
-- =====================================================

-- Sales header
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'card', 'ewallet')),
    payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items (detail)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL MANAGEMENT
-- =====================================================

-- Financial transactions
CREATE TABLE finances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category VARCHAR(100),
    reference_id UUID, -- Reference to sale_id or other transaction
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON tenant_members(user_id);

-- Product indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);

-- Sales indexes
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_tenant_id ON sale_items(tenant_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Finance indexes
CREATE INDEX idx_finances_tenant_id ON finances(tenant_id);
CREATE INDEX idx_finances_type ON finances(type);
CREATE INDEX idx_finances_created_at ON finances(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - USERS TABLE
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_id = auth.uid());

-- =====================================================
-- RLS POLICIES - TENANTS TABLE
-- =====================================================

-- Users can view their tenant
CREATE POLICY "Users can view their tenant" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can update their tenant (only owners)
CREATE POLICY "Owners can update their tenant" ON tenants
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid() AND role = 'owner'
        )
    );

-- =====================================================
-- RLS POLICIES - TENANT MEMBERS TABLE
-- =====================================================

-- Users can view their tenant membership
CREATE POLICY "Users can view tenant membership" ON tenant_members
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES - CATEGORIES TABLE
-- =====================================================

-- Users can view categories from their tenant
CREATE POLICY "Users can view tenant categories" ON categories
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can insert categories for their tenant
CREATE POLICY "Users can insert tenant categories" ON categories
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can update categories from their tenant
CREATE POLICY "Users can update tenant categories" ON categories
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can delete categories from their tenant
CREATE POLICY "Users can delete tenant categories" ON categories
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES - PRODUCTS TABLE
-- =====================================================

-- Users can view products from their tenant
CREATE POLICY "Users can view tenant products" ON products
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can insert products for their tenant
CREATE POLICY "Users can insert tenant products" ON products
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can update products from their tenant
CREATE POLICY "Users can update tenant products" ON products
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can delete products from their tenant
CREATE POLICY "Users can delete tenant products" ON products
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES - SALES TABLE
-- =====================================================

-- Users can view sales from their tenant
CREATE POLICY "Users can view tenant sales" ON sales
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can insert sales for their tenant
CREATE POLICY "Users can insert tenant sales" ON sales
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can update sales from their tenant
CREATE POLICY "Users can update tenant sales" ON sales
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can delete sales from their tenant
CREATE POLICY "Users can delete tenant sales" ON sales
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES - SALE ITEMS TABLE
-- =====================================================

-- Users can view sale items from their tenant
CREATE POLICY "Users can view tenant sale items" ON sale_items
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can insert sale items for their tenant
CREATE POLICY "Users can insert tenant sale items" ON sale_items
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can update sale items from their tenant
CREATE POLICY "Users can update tenant sale items" ON sale_items
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can delete sale items from their tenant
CREATE POLICY "Users can delete tenant sale items" ON sale_items
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES - FINANCES TABLE
-- =====================================================

-- Users can view finances from their tenant
CREATE POLICY "Users can view tenant finances" ON finances
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can insert finances for their tenant
CREATE POLICY "Users can insert tenant finances" ON finances
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can update finances from their tenant
CREATE POLICY "Users can update tenant finances" ON finances
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Users can delete finances from their tenant
CREATE POLICY "Users can delete tenant finances" ON finances
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE auth_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_members_updated_at BEFORE UPDATE ON tenant_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_items_updated_at BEFORE UPDATE ON sale_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finances_updated_at BEFORE UPDATE ON finances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create tenant on user registration
CREATE OR REPLACE FUNCTION public.create_tenant_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
BEGIN
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create tenant on new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_tenant_for_new_user();

-- Function to update stock when sale is made
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Reduce stock when sale item is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE products 
        SET stock = stock - NEW.quantity
        WHERE id = NEW.product_id AND tenant_id = NEW.tenant_id;
    -- Restore stock when sale item is deleted
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET stock = stock + OLD.quantity
        WHERE id = OLD.product_id AND tenant_id = OLD.tenant_id;
    -- Adjust stock when sale item is updated
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE products 
        SET stock = stock + OLD.quantity - NEW.quantity
        WHERE id = NEW.product_id AND tenant_id = NEW.tenant_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for stock management
CREATE TRIGGER manage_product_stock
    AFTER INSERT OR UPDATE OR DELETE ON sale_items
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                         LPAD(EXTRACT(MICROSECONDS FROM NOW())::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for invoice number generation
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();