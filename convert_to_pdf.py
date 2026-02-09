# -*- coding: utf-8 -*-
from fpdf import FPDF
import re
import base64
import urllib.request
import urllib.parse
import os
import tempfile

# Teste simples das imagens
print("Testando imagens...")
images_dir = r'd:\Documentos\ox-field-service\pdf_images'
test_images = ['arquitecture_diagram.png', 'apps_diagram.png', 'workflow_diagram.png']

for img_name in test_images:
    img_path = os.path.join(images_dir, img_name)
    if os.path.exists(img_path):
        print(f"[OK] {img_name} existe ({os.path.getsize(img_path)} bytes)")
        try:
            # Teste rápido de carregamento da imagem
            with open(img_path, 'rb') as f:
                header = f.read(8)
                if header.startswith(b'\x89PNG'):
                    print(f"  [OK] {img_name} e PNG valido")
                else:
                    print(f"  [ERROR] {img_name} NAO e PNG valido")
        except Exception as e:
            print(f"  [ERROR] Erro ao ler {img_name}: {e}")
    else:
        print(f"[MISSING] {img_name} nao encontrado")

print("Iniciando processamento do PDF...")

class PDF(FPDF):
    def __init__(self):
        super().__init__()

    def header(self):
        if self.page_no() == 1:
            # Logo/Brand
            self.set_font('Arial', 'B', 28)
            self.set_text_color(8, 145, 178)  # Azul Ox Field
            self.cell(0, 20, 'OX FIELD SERVICES', align='C')
            self.ln(20)

            # Tagline
            self.set_font('Arial', '', 14)
            self.set_text_color(100, 100, 100)
            self.cell(0, 10, 'Plataforma SaaS Completa para Gestao de Servicos de Campo', align='C')
            self.ln(10)

            # Linha decorativa
            self.set_draw_color(8, 145, 178)
            self.set_line_width(1.0)
            self.line(20, 45, 180, 45)
            self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', '', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Pagina {self.page_no()}', align='C')

    def chapter_title(self, title, level=1):
        if level == 1:
            self.set_font('Arial', 'B', 16)
            self.set_text_color(8, 145, 178)
            self.ln(8)
        elif level == 2:
            self.set_font('Arial', 'B', 14)
            self.set_text_color(14, 116, 144)
            self.ln(6)
        elif level == 3:
            self.set_font('Arial', 'B', 12)
            self.set_text_color(21, 94, 117)
            self.ln(4)
        else:
            self.set_font('Arial', 'B', 11)
            self.set_text_color(30, 58, 95)
            self.ln(3)

        self.multi_cell(0, 7, title)

        if level == 1:
            self.set_draw_color(8, 145, 178)
            self.set_line_width(0.5)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(3)
        self.ln(2)

    def body_text(self, text):
        self.set_font('Arial', '', 10)
        self.set_text_color(51, 51, 51)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def code_block(self, code, is_sql=False):
        self.set_fill_color(30, 30, 30) if not is_sql else self.set_fill_color(40, 44, 52)
        self.set_font('Courier', '', 8)
        self.set_text_color(212, 212, 212)
        lines = code.strip().split('\n')
        for line in lines:
            if len(line) > 95:
                line = line[:92] + '...'
            self.cell(0, 4, '  ' + line, fill=True)
            self.ln(4)
        self.ln(3)
        self.set_text_color(51, 51, 51)

    def table_row(self, cells, is_header=False):
        if is_header:
            self.set_fill_color(8, 145, 178)
            self.set_text_color(255, 255, 255)
            self.set_font('Arial', 'B', 9)
        else:
            self.set_fill_color(248, 249, 250)
            self.set_text_color(51, 51, 51)
            self.set_font('Arial', '', 9)
        
        col_width = 190 / len(cells)
        for cell in cells:
            text = cell.strip()[:30]  # Limitar texto
            self.cell(col_width, 7, text, border=1, fill=is_header, align='L')
        self.ln()

    def bullet_item(self, text, indent=0):
        self.set_font('Arial', '', 10)
        self.set_text_color(51, 51, 51)
        x = 15 + (indent * 5)
        self.set_x(x)
        bullet = '-' if indent == 0 else '-'
        self.multi_cell(0, 5, f'{bullet} {text}')

    def numbered_item(self, num, text):
        self.set_font('Arial', '', 10)
        self.set_text_color(51, 51, 51)
        self.set_x(15)
        self.multi_cell(0, 5, f'{num}. {text}')

    def add_mermaid_diagram(self, mermaid_code, temp_dir, diagram_type="generic"):
        """Adiciona diagramas reais baseados no tipo ou tenta renderizar via API"""
        
        # Caminhos das imagens dos diagramas (versões RGB para compatibilidade com FPDF)
        images_dir = r'd:\Documentos\ox-field-service\pdf_images'
        diagram_images = {
            "architecture": os.path.join(images_dir, 'arquitecture_diagram_rgb.png'),
            "apps": os.path.join(images_dir, 'apps_diagram_rgb.png'),
            "workflow": os.path.join(images_dir, 'workflow_diagram_rgb.png')
        }
        
        try:
            # Verificar se e uma pagina nova necessaria
            if self.get_y() > 180:
                self.add_page()
            
            # 1. Tentar carregar imagem local se existir
            if diagram_type in diagram_images:
                image_path = diagram_images[diagram_type]
                if os.path.exists(image_path):
                    print(f'Tentando carregar imagem: {image_path}')
                    try:
                        page_width = 210
                        margin = 20
                        max_width = page_width - (margin * 2)
                        self.image(image_path, x=margin, w=max_width)
                        self.ln(10)
                        print(f'Imagem {diagram_type} carregada com sucesso!')
                        return True
                    except Exception as img_error:
                        print(f'Erro ao carregar imagem {diagram_type}: {img_error}')

            # 2. Tentar renderizar via API mermaid.ink se falhar o local
            try:
                # Codificar o codigo Mermaid em base64
                encoded = base64.urlsafe_b64encode(mermaid_code.encode('utf-8')).decode('utf-8')
                url = f'https://mermaid.ink/img/{encoded}?theme=dark&bgColor=1a1a2e'
                
                img_path = os.path.join(temp_dir, f'mermaid_{hash(mermaid_code)}.png')
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = response.read()
                    if data.startswith(b'\x89PNG'): # Verificar se e um PNG valido
                        with open(img_path, 'wb') as f:
                            f.write(data)
                        self.image(img_path, x=20, w=170)
                        self.ln(5)
                        return True
            except:
                pass

            # 3. Fallback para placeholder visual
            self.set_fill_color(248, 249, 250)
            self.set_draw_color(200, 200, 200)
            self.rect(10, self.get_y(), 190, 40, 'FD')
            
            self.set_font('Arial', 'I', 9)
            self.set_text_color(100, 100, 100)
            self.set_xy(10, self.get_y() + 5)
            self.cell(190, 5, f'[Diagrama {diagram_type.upper()} - Adicione a imagem em pdf_images/]', align='C')
            self.set_xy(10, self.get_y() + 10)
            self.set_font('Arial', '', 7)
            self.cell(190, 5, f'Dica: Gere o PNG no mermaid.live e salve como {diagram_type}_diagram.png', align='C')
            self.ln(45)
            
            return True
        except Exception as e:
            print(f'Erro ao processar diagrama: {e}')
            return False

# Criar diretorio temporario para imagens
temp_dir = tempfile.mkdtemp()
print(f'Diretorio temporario: {temp_dir}')

# Criar diretorio para imagens dos diagramas reais
images_dir = r'd:\Documentos\ox-field-service\pdf_images'
os.makedirs(images_dir, exist_ok=True)
print(f'Diretorio de imagens: {images_dir}')

# Criar PDF
pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# CONTEUDO DA APRESENTACAO
content = """
OX FIELD SERVICES
Plataforma SaaS para Gestao Completa de Servicos de Campo

EXECUTIVO SUMMARY

O Ox Field Services e uma plataforma SaaS completa que revoluciona a gestao de servicos de campo para empresas de manutencao, facilitacao e servicos tecnicos. Através de uma arquitetura multitenant robusta, conectamos empresas, tecnicos e clientes em um ecossistema digital integrado.

Impacto de Mercado
- Mercado Global FSM: $50+ Bilhoes (CAGR 15%)
- Digitalizacao: Apenas 30% das empresas usam solucoes digitais
- Oportunidade: Mercado enderecavel de $15 Bilhoes

ARQUITETURA DA SOLUCAO

4 Aplicativos Especializados

```mermaid
graph TD
    A[OX FIELD SERVICES<br/>Plataforma SaaS] --> B[App Tecnico<br/>Mobile]
    A --> C[App Cliente<br/>Mobile] 
    A --> D[Painel Empresa<br/>Web]
    A --> E[Admin Global<br/>Web]
    
    B --> F[Backend API<br/>Java/Spring Boot]
    C --> F
    D --> F
    E --> F
    
    F --> G[(PostgreSQL<br/>+ PostGIS)]
    F --> H[Redis Cache]
    F --> I[AWS S3<br/>Storage]
    F --> J[Google Maps<br/>API]
    F --> K[Firebase<br/>FCM]
    
    style A fill:#0891b2,color:#fff
    style F fill:#059669,color:#fff
```

Arquitetura Hexagonal (Ports & Adapters)
- Separacao clara entre dominio e infraestrutura
- Testabilidade e manutibilidade superiores
- Multitenancy com isolamento total de dados

FUNCIONALIDADES PRINCIPAIS

Para Tecnicos (App Mobile)

1. Autenticacao e Onboarding
- Registro biometrico com validacao de documentos
- Aprovacao obrigatoria antes do primeiro servico
- Status tracking (PENDING - APPROVED - ACTIVE)

```mermaid
graph LR
    subgraph "OX FIELD SERVICES"
        A[Tecnicos] --> B[App Mobile<br/>Offline-First]
        C[Empresas] --> D[Painel Web<br/>Dashboard & Dispatch]
        E[Clientes] --> F[App Mobile<br/>Solicitacoes & Tracking]
        G[Admin] --> H[Painel Web<br/>Gestao Global]
    end
    
    B --> I[Backend API]
    D --> I
    F --> I
    H --> I
    
    style I fill:#0891b2,color:#fff
```

2. Agenda Inteligente
- Tarefas do dia com prioridades visuais
- Roteirizacao otimizada por proximidade
- Controle de jornada com alertas de pausa

3. Execucao Offline-First
- Sincronizacao inteligente quando volta online
- GPS validation (200m do endereco para marcar chegada)
- Checklist obrigatorio (100% para finalizar)

4. Documentacao Digital
- Fotos antes/depois com geolocalizacao
- Assinatura digital do cliente
- Materiais utilizados com controle de estoque

Para Empresas (Painel Web)

1. Dashboard Executivo
- KPIs em tempo real: Jobs ativos, receita, eficiencia
- Graficos interativos: Completions semanais, performance
- Alertas criticos: Tenants com saude baixa

2. Dispatch Inteligente
- Sugestao automatica de tecnicos por:
  - Proximidade geografica (Google Maps)
  - Skills compativeis
  - Carga de trabalho atual
- Agendamento visual tipo Gantt
- Reagendamento com notificacao push

3. Gestao de Tecnicos
- Aprovacao de documentos (RG, certificados)
- Avaliacao de performance (rating, tempo medio)
- Controle de territorio e especialidades

4. Inventario e Custos
- Catalogo de materiais com precos atualizados
- Controle de estoque em tempo real
- Precificacao dinamica baseada em distancia e materiais

Para Clientes (App Mobile)

1. Solicitacao de Servicos
- Interface intuitiva para descrever problemas
- Upload de fotos do local
- Agendamento flexivel com slots disponiveis

2. Rastreamento em Tempo Real
- Localizacao do tecnico via GPS
- Tempo estimado de chegada
- Chat integrado para comunicacao

3. Historico e Avaliacao
- Historico completo de servicos realizados
- Avaliacao de 5 estrelas com comentarios
- Faturas digitais e comprovantes

Para Admin Global (Painel Web)

1. Gestao de Tenants
- Provisionamento de novas empresas
- Monitoramento de saude (0-100 score)
- Suspencao/reativacao de contas

2. Analytics Globais
- MRR agregado de todos os tenants
- Metricas de crescimento mensal/anual
- Logs de auditoria e compliance

TECNOLOGIAS E INTEGACOES

Stack Tecnologico

Componente | Tecnologia | Versao | Proposito
Backend | Java 21 + Spring Boot | 3.2.1 | API REST robusta
Database | PostgreSQL + PostGIS | 15+ | Dados geoespaciais
Cache | Redis | 7.x | Performance e sessions
Storage | AWS S3 | SDK v2 | Arquivos e midia
Maps | Google Maps API | - | Roteirizacao e geocoding
Push | Firebase Cloud Messaging | 9.x | Notificacoes mobile
Frontend | React + TypeScript | 19.x | Interfaces responsivas

Integracoes Externas

AWS S3 (Armazenamento)
- Fotos de evidencias com URLs pre-assinadas
- Assinaturas digitais em formato PNG
- Documentos de onboarding (RG, certificados)

Google Maps API
- Geocoding de enderecos para coordenadas
- Distance Matrix para calculo de rotas
- Directions API para polylines no mapa

Firebase Cloud Messaging
- Push notifications para todos os usuarios
- Notificacoes de agendamento e atualizacoes
- Alertas de emergencia e lembretes

VALIDACOES DE NEGOCIO CRITICAS

Regras de Transicao de Status

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED: Agendamento criado
    SCHEDULED --> IN_ROUTE: Tecnico iniciou deslocamento
    IN_ROUTE --> IN_PROGRESS: GPS validado (200m)
    IN_PROGRESS --> COMPLETED: Checklist 100% + Foto AFTER + Assinatura
    COMPLETED --> [*]: Servico finalizado
    
    SCHEDULED --> CANCELLED: Cancelamento
    IN_PROGRESS --> CANCELLED: Cancelamento
    
    style COMPLETED fill:#059669,color:#fff
    style CANCELLED fill:#dc2626,color:#fff
```

Engine de Precificacao

Subtotal = BaseRate + (Distance x KmRate) x CategoryMultiplier + Materials
VAT = Subtotal x 0.21 (Belgica)
Total = Subtotal + VAT

Fatores de Custo:
- Base Rate: 45-150 por categoria (HVAC, Eletrica, etc.)
- Distancia: 0.50/km ate 50km, 0.75/km acima
- Materiais: Custo real + markup de 20%
- Urgencia: Multiplicador 1.5x para high priority

METRICAS DE SUCESSO

KPIs de Produto
- Tempo Medio de Resolucao: < 45 minutos
- Taxa de Conclusao: > 95%
- Satisfacao do Cliente: > 4.8 estrelas
- Uptime da Plataforma: > 99.9%

KPIs de Negocio
- MRR por Tenant: 500-5,000
- CAGR Projetado: 150% nos primeiros 2 anos
- LTV/CAC Ratio: > 3:1
- Churn Rate: < 5% ao ano

ROADMAP DE DESENVOLVIMENTO

Fase 1 (MVP) - 3 Meses
- Backend core com autenticacao
- App Tecnico basico
- Dashboard Empresa
- Deploy inicial

Fase 2 (Expansao) - 3 Meses
- App Cliente completo
- Dispatch inteligente
- Integracoes externas
- Admin Global

Fase 3 (Scale) - 6 Meses
- Multi-regiao (EU, US, LATAM)
- Analytics avancado
- Mobile offline completo
- Marketplace de servicos

VANTAGENS COMPETITIVAS

Diferencial Tecnologico
- Arquitetura Hexagonal: Facilita evolucao e testes
- Offline-First: Funciona sem conexao
- GPS Validation: Garante qualidade dos servicos
- Multitenancy Robusta: Isolamento total de dados

Diferencial de Produto
- 4 Apps Especializados: Cada usuario tem sua interface ideal
- Engine de Precificacao: Calculo justo e transparente
- Dispatch Inteligente: Otimizacao automatica de rotas
- Validacoes Rigidas: Qualidade garantida dos servicos

Diferencial de Mercado
- Foco B2B SaaS: Modelo escalavel de receita
- Mercado Europeu: Regulacao GDPR compliant
- Suporte Multi-idioma: Ingles, Frances, Holandes
- Precos Competitivos: 50% abaixo dos concorrentes

CONCLUSAO

O Ox Field Services representa uma oportunidade unica no mercado de FSM:

Por que Investir Agora?
- Mercado em crescimento com digitalizacao atrasada
- Tecnologia diferenciada com arquitetura moderna
- Modelo SaaS escalavel com LTV alto
- Equipe tecnica experiente com track record

Proximos Passos
1. Finalizar MVP e validar com primeiros clientes
2. Levantar Seed Round 500k para expansao
3. Lancamento comercial Q1 2026
4. Scale para 100 tenants no primeiro ano

Documento Confidencial - Ox Field Services 2026
"""

# Processar conteudo linha por linha
lines = content.split('\n')
in_code_block = False
code_buffer = []
code_type = ''
in_table = False
table_rows = []
i = 0

print(f'Iniciando processamento de {len(lines)} linhas...')

while i < len(lines):
    if i % 100 == 0:
        print(f'Processando linha {i}/{len(lines)}...')

    # Limite de segurança para evitar loop infinito
    if i > 2000:
        print("Limite de segurança atingido, saindo...")
        break

    line = lines[i]

    # Bloco de codigo
    if line.startswith('```'):
        if in_code_block:
            code_content = '\n'.join(code_buffer)
            if code_type == 'mermaid':
                print(f'Processando diagrama Mermaid...')

                # Detectar tipo do diagrama
                diag_type = "generic"
                if "graph" in code_content:
                    if "Backend API" in code_content:
                        diag_type = "architecture"
                    elif "Tecnicos" in code_content or "Empresas" in code_content:
                        diag_type = "apps"
                elif "stateDiagram" in code_content:
                    diag_type = "workflow"

                print(f'Tipo detectado: {diag_type}')
                pdf.add_mermaid_diagram(code_content, temp_dir, diag_type)
            elif code_type in ['sql', 'java', 'javascript', 'typescript']:
                pdf.code_block(code_content, is_sql=(code_type == 'sql'))
            else:
                pdf.code_block(code_content)
            code_buffer = []
            in_code_block = False
            code_type = ''
        else:
            in_code_block = True
            code_type = line[3:].strip().lower()
        i += 1
        continue

    if in_code_block:
        code_buffer.append(line)
        i += 1
        continue

    # Tabela
    if line.startswith('|') and '|' in line[1:]:
        cells = [c.strip() for c in line.split('|')[1:-1]]
        if cells and not all(c.replace('-', '').replace(':', '') == '' for c in cells):
            if not in_table:
                in_table = True
                table_rows = [cells]
            else:
                table_rows.append(cells)
        i += 1
        continue
    elif in_table:
        if table_rows:
            for idx, row in enumerate(table_rows):
                pdf.table_row(row, is_header=(idx == 0))
            pdf.ln(3)
        table_rows = []
        in_table = False

    # Titulos
    if line.startswith('# '):
        pdf.chapter_title(line[2:], level=1)
    elif line.startswith('## '):
        pdf.chapter_title(line[3:], level=2)
    elif line.startswith('### '):
        pdf.chapter_title(line[4:], level=3)
    elif line.startswith('#### '):
        pdf.chapter_title(line[5:], level=4)
    # Lista numerada
    elif re.match(r'^\d+\.\s', line):
        match = re.match(r'^(\d+)\.\s(.+)', line)
        if match:
            pdf.numbered_item(match.group(1), match.group(2))
    # Lista com bullet
    elif line.startswith('- [ ]') or line.startswith('- [x]'):
        checked = '[x]' in line
        text = line[6:].strip()
        symbol = 'V' if checked else '[ ]'
        pdf.bullet_item(f'{symbol} {text}')
    elif line.startswith('- ') or line.startswith('* '):
        pdf.bullet_item(line[2:])
    elif line.startswith('  - ') or line.startswith('  * '):
        pdf.bullet_item(line[4:], indent=1)
    # Linha horizontal
    elif line.strip() == '---':
        pdf.ln(3)
        pdf.set_draw_color(200, 200, 200)
        pdf.set_line_width(0.3)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(5)
    # Texto normal
    elif line.strip():
        text = line
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'`(.+?)`', r'\1', text)
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
        pdf.body_text(text)

    i += 1

# Processar ultima tabela
if in_table and table_rows:
    for idx, row in enumerate(table_rows):
        pdf.table_row(row, is_header=(idx == 0))

# Rodape final
pdf.ln(10)
pdf.set_font('Arial', 'I', 9)
pdf.set_text_color(150, 150, 150)
pdf.cell(0, 10, 'Documento Confidencial - Ox Field Services 2026', align='C')

# Salvar PDF
output_path = r'd:\Documentos\ox-field-service\Apresentacao_OxField_Services.pdf'
pdf.output(output_path)

# Limpar arquivos temporarios
import shutil
try:
    shutil.rmtree(temp_dir)
except:
    pass

print(f'\nPDF gerado com sucesso: {output_path}')
