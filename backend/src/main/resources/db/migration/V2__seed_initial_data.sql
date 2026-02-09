-- ==========================================
-- SEED DATA
-- ==========================================

-- 1. Tenant (Empresa de Teste)
INSERT INTO tenants (id, name, domain, status, region, health_score, mrr)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Ox Field Services Demo',
    'demo.oxfield.com',
    'ACTIVE',
    'eu-west-1',
    100,
    1500.00
) ON CONFLICT (id) DO NOTHING;

-- 2. Global Admin
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, language, theme)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111', -- Linked to demo tenant for simplicity, or could have a separate "Global" tenant
    'admin@oxfield.com',
    'Global Admin',
    'ADMIN_GLOBAL',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS', -- password: 'password'
    'en-US',
    'dark'
) ON CONFLICT (id) DO NOTHING;

-- 3. Company Admin (Gestor)
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'manager@demo.com',
    'John Manager',
    'ADMIN_EMPRESA',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS' -- password: 'password'
) ON CONFLICT (id) DO NOTHING;

-- 4. Technician User
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'tech@demo.com',
    'Alex Technician',
    'TECNICO',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS', -- password: 'password'
    '+5511999999999'
) ON CONFLICT (id) DO NOTHING;

-- 5. Technician Profile
INSERT INTO technicians (id, tenant_id, user_id, skills, rating, is_online, vehicle_model, vehicle_plate)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    ARRAY['hvac', 'electrical'],
    4.8,
    true,
    'Ford Transit',
    'ABC-1234'
) ON CONFLICT (id) DO NOTHING;

-- 6. Client User
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'client@demo.com',
    'Maria Santos',
    'CLIENTE',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS', -- password: 'password'
    '+5511888888888'
) ON CONFLICT (id) DO NOTHING;

-- 7. Customer Profile
INSERT INTO customers (id, tenant_id, user_id, company_name)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666666',
    'Santos & Filhos Ltda'
) ON CONFLICT (id) DO NOTHING;
