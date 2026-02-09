-- ==========================================
-- TABLE: service_listings (marketplace listings per tenant)
-- ==========================================
CREATE TABLE IF NOT EXISTS service_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price_from DECIMAL(10, 2),
    image_url VARCHAR(1024),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_listings_tenant_active ON service_listings(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_service_listings_category ON service_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_active ON service_listings(active) WHERE active = true;
