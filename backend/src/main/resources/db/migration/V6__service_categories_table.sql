-- ==========================================
-- TABLE: service_categories (categorias dinâmicas por tenant)
-- ==========================================
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    default_duration_minutes INTEGER,
    price_multiplier DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_service_categories_tenant_code UNIQUE (tenant_id, code)
);

-- ==========================================
-- Seed: 4 categorias padrão por tenant
-- ==========================================
INSERT INTO service_categories (id, tenant_id, name, code, description, default_duration_minutes, price_multiplier)
SELECT gen_random_uuid(), t.id, 'HVAC', 'hvac', 'Heating, Ventilation, Air Conditioning', 90, 1.20
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO service_categories (id, tenant_id, name, code, description, default_duration_minutes, price_multiplier)
SELECT gen_random_uuid(), t.id, 'Electrical', 'electrical', 'Electrical services', 60, 1.10
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO service_categories (id, tenant_id, name, code, description, default_duration_minutes, price_multiplier)
SELECT gen_random_uuid(), t.id, 'Plumbing', 'plumbing', 'Plumbing services', 75, 1.00
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO service_categories (id, tenant_id, name, code, description, default_duration_minutes, price_multiplier)
SELECT gen_random_uuid(), t.id, 'General', 'general', 'General maintenance', 60, 0.90
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ==========================================
-- ALTER service_orders: add category_id, migrate data, drop category
-- ==========================================
ALTER TABLE service_orders ADD COLUMN category_id UUID REFERENCES service_categories(id);

UPDATE service_orders o
SET category_id = sc.id
FROM service_categories sc
WHERE o.tenant_id = sc.tenant_id
  AND sc.code = LOWER(TRIM(o.category));

UPDATE service_orders o
SET category_id = (SELECT id FROM service_categories sc WHERE sc.tenant_id = o.tenant_id AND sc.code = 'general' LIMIT 1)
WHERE o.category_id IS NULL;

ALTER TABLE service_orders ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE service_orders DROP COLUMN category;