# 🐳 Ox Field Services - Guia de Comandos Docker

## 📋 Pré-requisitos

- Docker Desktop instalado e em execução
- Porta 5432 (PostgreSQL) e 6379 (Redis) disponíveis

---

## 🚀 Iniciar o Banco de Dados

### Primeira Execução (cria containers e inicializa o schema)
```bash
docker-compose up -d
```

### Verificar se os containers estão rodando
```bash
docker-compose ps
```

**Saída esperada:**
```
NAME               IMAGE                   STATUS          PORTS
oxfield-postgres   postgis/postgis:15-3.3  Up (healthy)    0.0.0.0:5432->5432/tcp
oxfield-redis      redis:7-alpine          Up (healthy)    0.0.0.0:6379->6379/tcp
```

---

## 🗺️ Verificar Extensão PostGIS

### Conectar ao PostgreSQL e verificar extensões
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');"
```

**Saída esperada:**
```
  extname  | extversion
-----------+------------
 uuid-ossp | 1.1
 postgis   | 3.3.x
(2 rows)
```

### Verificar versão completa do PostGIS
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "SELECT PostGIS_Version();"
```

---

## 📜 Visualizar Logs de Inicialização do Schema

### Ver logs completos do container
```bash
docker-compose logs oxfield-db
```

### Ver apenas os logs de inicialização (primeiras ~100 linhas)
```bash
docker-compose logs oxfield-db 2>&1 | head -100
```

### Acompanhar logs em tempo real
```bash
docker-compose logs -f oxfield-db
```

### Verificar se as tabelas foram criadas
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "\dt"
```

**Saída esperada (tabelas criadas pelo schema.sql):**
```
                List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+----------
 public | audit_logs              | table | postgres
 public | billing_metrics         | table | postgres
 public | checklist_templates     | table | postgres
 public | customer_addresses      | table | postgres
 public | customers               | table | postgres
 public | global_admin_users      | table | postgres
 public | materials               | table | postgres
 public | notifications           | table | postgres
 public | order_checklists        | table | postgres
 public | order_materials         | table | postgres
 public | order_messages          | table | postgres
 public | order_photos            | table | postgres
 public | order_signatures        | table | postgres
 public | payment_methods         | table | postgres
 public | service_orders          | table | postgres
 public | spatial_ref_sys         | table | postgres
 public | technician_documents    | table | postgres
 public | technicians             | table | postgres
 public | tenants                 | table | postgres
 public | users                   | table | postgres
```

---

## 🛑 Parar os Containers

### Parar sem remover dados
```bash
docker-compose stop
```

### Parar e remover containers (dados preservados no volume)
```bash
docker-compose down
```

### ⚠️ Parar e REMOVER TODOS OS DADOS (reset completo)
```bash
docker-compose down -v
rm -rf ./postgres-data ./redis-data
```

---

## 🔄 Reiniciar com Schema Limpo

Se precisar recriar o banco do zero:

```bash
# 1. Parar e remover tudo
docker-compose down -v

# 2. Remover dados persistidos
rm -rf ./postgres-data ./redis-data

# 3. Iniciar novamente (schema.sql será executado)
docker-compose up -d

# 4. Verificar logs de inicialização
docker-compose logs oxfield-db
```

---

## 🔌 Conexão do Backend Spring Boot

O backend já está configurado para conectar automaticamente. Variáveis no `application.yml`:

| Variável | Valor Padrão |
|----------|--------------|
| `DB_HOST` | localhost |
| `DB_PORT` | 5432 |
| `DB_NAME` | oxfield |
| `DB_USER` | postgres |
| `DB_PASSWORD` | postgres |

### String de conexão JDBC
```
jdbc:postgresql://localhost:5432/oxfield
```

---

## 🐞 Troubleshooting

### Erro: "port 5432 already in use"
```bash
# Windows
netstat -ano | findstr :5432
taskkill /F /PID <PID>

# Linux/Mac
sudo lsof -i :5432
sudo kill -9 <PID>
```

### Erro: "permission denied" no volume
```bash
# Linux - ajustar permissões
sudo chown -R 999:999 ./postgres-data
```

### Verificar saúde do container
```bash
docker inspect oxfield-postgres --format='{{.State.Health.Status}}'
```

### Acessar shell do container PostgreSQL
```bash
docker exec -it oxfield-postgres bash
```

### Acessar cliente psql diretamente
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield
```

---

## 📊 Comandos Úteis de Banco

### Listar todos os ENUMs criados
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "\dT+"
```

### Ver estrutura de uma tabela específica
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "\d+ service_orders"
```

### Verificar índices criados
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "\di"
```

### Testar função geoespacial do PostGIS
```bash
docker exec -it oxfield-postgres psql -U postgres -d oxfield -c "SELECT ST_Distance(ST_MakePoint(-46.6333, -23.5505)::geography, ST_MakePoint(-46.6580, -23.5617)::geography);"
```
> Calcula a distância em metros entre dois pontos em São Paulo (~2.8 km)
