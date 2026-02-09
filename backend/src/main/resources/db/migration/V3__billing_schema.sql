-- ==========================================
-- BILLING SYSTEM SCHEMA
-- OxField Services - SaaS Billing
-- ==========================================

-- ==========================================
-- ENUMS for Billing
-- ==========================================

DO $$ BEGIN
    CREATE TYPE plan_edition AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED', 'TRIALING', 'PAUSED');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_item_type AS ENUM ('ADMIN', 'GESTOR', 'TECNICO');
    EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- TABLE: subscriptions
-- Assinaturas dos tenants
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_edition VARCHAR(20) NOT NULL DEFAULT 'STARTER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    billing_cycle_day INTEGER NOT NULL DEFAULT 1,
    current_period_start DATE,
    current_period_end DATE,
    monthly_base_amount DECIMAL(10,2),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    default_payment_method_id VARCHAR(255),
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster tenant lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ==========================================
-- TABLE: subscription_items
-- Itens da assinatura (usuários por tipo)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscription_items (
    id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_subscription_item_type UNIQUE (subscription_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription ON subscription_items(subscription_id);

-- ==========================================
-- TABLE: invoices
-- Faturas geradas
-- ==========================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);

-- ==========================================
-- TABLE: invoice_lines
-- Linhas/itens das faturas
-- ==========================================
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- ==========================================
-- TABLE: credit_balances
-- Saldo de créditos pré-pagos
-- ==========================================
CREATE TABLE IF NOT EXISTS credit_balances (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    credits_purchased INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2),
    stripe_payment_id VARCHAR(255),
    purchased_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_balances_tenant ON credit_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_balances_expires ON credit_balances(expires_at);

-- ==========================================
-- TABLE: credit_usage
-- Histórico de uso de créditos
-- ==========================================
CREATE TABLE IF NOT EXISTS credit_usage (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    credit_balance_id UUID REFERENCES credit_balances(id),
    resource_type VARCHAR(50) NOT NULL,
    credits_consumed INTEGER NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_tenant ON credit_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_balance ON credit_usage(credit_balance_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_type ON credit_usage(resource_type);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created ON credit_usage(created_at);

-- ==========================================
-- Add billing email to tenants if not exists
-- ==========================================
DO $$ BEGIN
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_address TEXT;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- ==========================================
-- SEED: Default pricing plans
-- ==========================================
-- Note: Plan pricing is defined in the PlanEdition enum in Java
-- This can be extended with a pricing_plans table if needed

COMMENT ON TABLE subscriptions IS 'Assinaturas dos tenants no modelo SaaS';
COMMENT ON TABLE subscription_items IS 'Itens da assinatura - contagem de usuários por tipo';
COMMENT ON TABLE invoices IS 'Faturas geradas para cobrança';
COMMENT ON TABLE invoice_lines IS 'Linhas detalhadas das faturas';
COMMENT ON TABLE credit_balances IS 'Saldo de créditos pré-pagos (pay-as-you-go)';
COMMENT ON TABLE credit_usage IS 'Histórico de consumo de créditos';
