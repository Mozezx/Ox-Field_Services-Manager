-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- ENUMS
-- ==========================================

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN_GLOBAL', 'ADMIN_EMPRESA', 'GESTOR', 'TECNICO', 'CLIENTE');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PROVISIONING', 'DELINQUENT');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE app_type AS ENUM ('TECH_APP', 'CLIENT_APP', 'EMPRESA_WEB', 'ADMIN_GLOBAL');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE os_status AS ENUM ('SCHEDULED', 'IN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_category AS ENUM ('HVAC', 'ELECTRICAL', 'PLUMBING', 'GENERAL');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE material_category AS ENUM ('ELECTRICAL', 'PLUMBING', 'HVAC', 'FASTENERS', 'GENERAL');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('ASSIGNMENT', 'ALERT', 'SYSTEM', 'INFO', 'SUCCESS', 'WARNING');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PIX', 'BOLETO');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- TABLE: tenants
-- ==========================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL, -- Enum stored as string or custom type
    region VARCHAR(50) NOT NULL,
    health_score INTEGER DEFAULT 100,
    mrr DECIMAL(12,2) DEFAULT 0,
    last_audit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLE: users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    password_hash VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme VARCHAR(20) DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID,
    CONSTRAINT uk_users_email_tenant UNIQUE (tenant_id, email)
);

-- ==========================================
-- TABLE: technicians
-- ==========================================
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[], -- Array of strings
    rating DECIMAL(3,2) DEFAULT 5.0,
    current_location GEOMETRY(POINT, 4326),
    last_location_update TIMESTAMPTZ,
    is_online BOOLEAN DEFAULT FALSE,
    vehicle_model VARCHAR(100),
    vehicle_plate VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: customers
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: customer_addresses
-- ==========================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'Brasil',
    location GEOMETRY(POINT, 4326),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: payment_methods
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    last_four VARCHAR(4),
    brand VARCHAR(50),
    expires_at VARCHAR(7),
    is_default BOOLEAN DEFAULT FALSE,
    provider_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: materials
-- ==========================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID,
    CONSTRAINT uk_materials_sku_tenant UNIQUE (tenant_id, sku)
);

-- ==========================================
-- TABLE: service_orders
-- ==========================================
CREATE TABLE IF NOT EXISTS service_orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    os_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    customer_id UUID NOT NULL REFERENCES customers(id),
    address_id UUID NOT NULL REFERENCES customer_addresses(id),
    technician_id UUID REFERENCES technicians(id),
    scheduled_date DATE NOT NULL,
    scheduled_start TIME NOT NULL,
    scheduled_duration INTEGER NOT NULL, -- in minutes
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    estimated_price DECIMAL(10,2),
    final_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID,
    CONSTRAINT uk_service_orders_number_tenant UNIQUE (tenant_id, os_number)
);

-- ==========================================
-- TABLE: order_checklists
-- ==========================================
CREATE TABLE IF NOT EXISTS order_checklists (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID UNIQUE NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: order_photos
-- ==========================================
CREATE TABLE IF NOT EXISTS order_photos (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    caption VARCHAR(255),
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    location GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: order_signatures
-- ==========================================
CREATE TABLE IF NOT EXISTS order_signatures (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID UNIQUE NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    signer_name VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: order_materials
-- ==========================================
CREATE TABLE IF NOT EXISTS order_materials (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: order_messages
-- ==========================================
CREATE TABLE IF NOT EXISTS order_messages (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- ==========================================
-- TABLE: notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);
