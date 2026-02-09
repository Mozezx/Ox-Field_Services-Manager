-- ==========================================
-- TABLE: technician_invites (one unique link per technician)
-- ==========================================
CREATE TABLE IF NOT EXISTS technician_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    technician_id UUID,
    CONSTRAINT uk_technician_invites_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_technician_invites_tenant_id ON technician_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_technician_invites_token ON technician_invites(token);
CREATE INDEX IF NOT EXISTS idx_technician_invites_status ON technician_invites(status);
