-- ==========================================
-- DADOS DE TESTE PARA MARKETPLACE
-- ==========================================
-- Cria empresas e técnicos online com localização para testar o marketplace

-- Empresa 1: Serviços Elétricos São Paulo
INSERT INTO tenants (id, name, domain, status, region, health_score, mrr, logo_url, description, total_reviews, average_rating)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Serviços Elétricos São Paulo',
    'eletrica-sp.oxfield.com',
    'ACTIVE',
    'us-east-1',
    100,
    2500.00,
    'https://via.placeholder.com/150',
    'Especialistas em instalações elétricas residenciais e comerciais. Atendimento 24h.',
    45,
    4.8
) ON CONFLICT (id) DO NOTHING;

-- Admin da Empresa 1
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@eletrica-sp.com',
    'João Silva',
    'ADMIN_EMPRESA',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS', -- password: 'password'
    '+5511999999999'
) ON CONFLICT (id) DO NOTHING;

-- Técnico 1 da Empresa 1 (Online, com localização em São Paulo)
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'tech1@eletrica-sp.com',
    'Carlos Eletricista',
    'TECNICO',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511988888888'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO technicians (id, tenant_id, user_id, skills, rating, is_online, current_location, vehicle_model, vehicle_plate)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    ARRAY['ELECTRICAL', 'GENERAL'],
    4.9,
    true,
    ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326), -- São Paulo, SP
    'Fiat Uno',
    'ABC-1234'
) ON CONFLICT (id) DO NOTHING;

-- ==========================================

-- Empresa 2: Ar Condicionado Premium
INSERT INTO tenants (id, name, domain, status, region, health_score, mrr, logo_url, description, total_reviews, average_rating)
VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Ar Condicionado Premium',
    'ar-premium.oxfield.com',
    'ACTIVE',
    'us-east-1',
    100,
    3200.00,
    'https://via.placeholder.com/150',
    'Instalação e manutenção de ar condicionado. Técnicos certificados.',
    78,
    4.9
) ON CONFLICT (id) DO NOTHING;

-- Admin da Empresa 2
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'admin@ar-premium.com',
    'Maria Santos',
    'ADMIN_EMPRESA',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511977777777'
) ON CONFLICT (id) DO NOTHING;

-- Técnico 1 da Empresa 2 (Online, com localização em São Paulo - região diferente)
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'tech1@ar-premium.com',
    'Pedro Refrigeração',
    'TECNICO',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511966666666'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO technicians (id, tenant_id, user_id, skills, rating, is_online, current_location, vehicle_model, vehicle_plate)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    ARRAY['HVAC', 'GENERAL'],
    4.8,
    true,
    ST_SetSRID(ST_MakePoint(-46.6417, -23.5489), 4326), -- São Paulo, SP (região próxima)
    'Chevrolet Onix',
    'XYZ-5678'
) ON CONFLICT (id) DO NOTHING;

-- ==========================================

-- Empresa 3: Hidráulica Express
INSERT INTO tenants (id, name, domain, status, region, health_score, mrr, logo_url, description, total_reviews, average_rating)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Hidráulica Express',
    'hidraulica-express.oxfield.com',
    'ACTIVE',
    'us-east-1',
    100,
    1800.00,
    'https://via.placeholder.com/150',
    'Serviços hidráulicos rápidos e eficientes. Atendimento emergencial.',
    32,
    4.7
) ON CONFLICT (id) DO NOTHING;

-- Admin da Empresa 3
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'admin@hidraulica-express.com',
    'Roberto Águas',
    'ADMIN_EMPRESA',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511955555555'
) ON CONFLICT (id) DO NOTHING;

-- Técnico 1 da Empresa 3 (Online, com localização em São Paulo)
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'tech1@hidraulica-express.com',
    'Fernando Encanador',
    'TECNICO',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511944444444'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO technicians (id, tenant_id, user_id, skills, rating, is_online, current_location, vehicle_model, vehicle_plate)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    '55555555-5555-5555-5555-555555555555',
    ARRAY['PLUMBING', 'GENERAL'],
    4.6,
    true,
    ST_SetSRID(ST_MakePoint(-46.6500, -23.5600), 4326), -- São Paulo, SP
    'Volkswagen Gol',
    'DEF-9012'
) ON CONFLICT (id) DO NOTHING;

-- ==========================================

-- Empresa 4: Serviços Gerais 24h
INSERT INTO tenants (id, name, domain, status, region, health_score, mrr, logo_url, description, total_reviews, average_rating)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    'Serviços Gerais 24h',
    'gerais-24h.oxfield.com',
    'ACTIVE',
    'us-east-1',
    100,
    1500.00,
    'https://via.placeholder.com/150',
    'Serviços gerais para sua casa. Elétrica, hidráulica, pintura e mais.',
    56,
    4.5
) ON CONFLICT (id) DO NOTHING;

-- Admin da Empresa 4
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777',
    'admin@gerais-24h.com',
    'Ana Geral',
    'ADMIN_EMPRESA',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511933333333'
) ON CONFLICT (id) DO NOTHING;

-- Técnico 1 da Empresa 4 (Online, com localização em São Paulo)
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, phone)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '77777777-7777-7777-7777-777777777777',
    'tech1@gerais-24h.com',
    'Lucas Multiserviços',
    'TECNICO',
    'APPROVED',
    '$2b$10$HGv3wNs0JhRNhM4yssotVOJOw5yxsYcj3LbzeFOiDVopdAqM2gziS',
    '+5511922222222'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO technicians (id, tenant_id, user_id, skills, rating, is_online, current_location, vehicle_model, vehicle_plate)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    '77777777-7777-7777-7777-777777777777',
    '99999999-9999-9999-9999-999999999999',
    ARRAY['GENERAL'],
    4.4,
    true,
    ST_SetSRID(ST_MakePoint(-46.6200, -23.5400), 4326), -- São Paulo, SP
    'Ford Ka',
    'GHI-3456'
) ON CONFLICT (id) DO NOTHING;
