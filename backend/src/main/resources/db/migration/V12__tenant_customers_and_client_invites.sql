-- ==========================================
-- TABLE: tenant_customers (many-to-many: client is registered with company)
-- ==========================================
CREATE TABLE IF NOT EXISTS tenant_customers (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    PRIMARY KEY (tenant_id, customer_id),
    CONSTRAINT uk_tenant_customers UNIQUE (tenant_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_customers_tenant_id ON tenant_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_customers_customer_id ON tenant_customers(customer_id);

-- ==========================================
-- TABLE: client_invites (one invite link per client association)
-- ==========================================
CREATE TABLE IF NOT EXISTS client_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT uk_client_invites_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_client_invites_tenant_id ON client_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites(token);
CREATE INDEX IF NOT EXISTS idx_client_invites_status ON client_invites(status);
