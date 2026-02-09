-- ==========================================
-- Migration V4: Marketplace Changes
-- Modifica o sistema para suportar modelo marketplace
-- onde clientes são globais e escolhem empresa por serviço
-- ==========================================

-- 1. Tornar tenant_id nullable em users (para clientes globais)
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Tornar tenant_id nullable em customers (para clientes globais)
ALTER TABLE customers ALTER COLUMN tenant_id DROP NOT NULL;

-- 3. Adicionar localização ao customer (para cálculo de proximidade)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- 4. Tornar tenant_id nullable em customer_addresses (pertencem a clientes globais)
ALTER TABLE customer_addresses ALTER COLUMN tenant_id DROP NOT NULL;

-- 5. Adicionar campos de marketplace aos tenants (empresas)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 5.00;

-- 6. Criar índice para busca de usuários globais por email
CREATE INDEX IF NOT EXISTS idx_users_global_email 
    ON users(email) 
    WHERE tenant_id IS NULL;

-- 7. Criar índice para busca de técnicos disponíveis por tenant
CREATE INDEX IF NOT EXISTS idx_technicians_available_by_tenant 
    ON technicians(tenant_id, is_online) 
    WHERE is_online = true AND current_location IS NOT NULL;

-- 8. Atualizar constraint de unicidade de email para permitir emails globais
-- Remove a constraint antiga se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_tenant_id_email_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_tenant_id_email_key;
    END IF;
END $$;

-- Cria nova constraint que permite email único por tenant OU globalmente (tenant_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_tenant 
    ON users(email, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 9. Comentários para documentação
COMMENT ON COLUMN users.tenant_id IS 'ID do tenant. NULL para clientes globais do marketplace.';
COMMENT ON COLUMN customers.tenant_id IS 'ID do tenant. NULL para clientes globais do marketplace.';
COMMENT ON COLUMN customers.location IS 'Localização atual do cliente para cálculo de proximidade com técnicos.';
COMMENT ON COLUMN tenants.logo_url IS 'URL do logo da empresa para exibição no marketplace.';
COMMENT ON COLUMN tenants.description IS 'Descrição da empresa para exibição no marketplace.';
COMMENT ON COLUMN tenants.total_reviews IS 'Total de avaliações recebidas pela empresa.';
COMMENT ON COLUMN tenants.average_rating IS 'Média de avaliações da empresa (0.00 a 5.00).';
