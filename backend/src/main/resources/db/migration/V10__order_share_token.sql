-- Token para partilhar link da OS com o cliente (sem auth)
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE;
