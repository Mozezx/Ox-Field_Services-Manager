# -*- coding: utf-8 -*-
from fpdf import FPDF
import os

class SimplePDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'Teste Ox Field Services', align='C')
        self.ln(10)

pdf = FPDF()
pdf.add_page()

# Título
pdf.set_font('Arial', 'B', 20)
pdf.cell(0, 20, 'OX FIELD SERVICES - Teste com Diagramas', align='C')
pdf.ln(20)

# Tentar adicionar as imagens
images_dir = r'd:\Documentos\ox-field-service\pdf_images'
diagram_images = {
    "architecture": os.path.join(images_dir, 'arquitecture_diagram.png'),  # Note: usando o nome correto
    "apps": os.path.join(images_dir, 'apps_diagram.png'),
    "workflow": os.path.join(images_dir, 'workflow_diagram.png')
}

for name, path in diagram_images.items():
    if os.path.exists(path):
        print(f'Adicionando {name}: {path}')
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, f'Diagrama: {name.upper()}', align='C')
        pdf.ln(10)

        try:
            # Adicionar imagem com tamanho controlado
            pdf.image(path, x=10, w=180)
            pdf.ln(15)
            print(f'Imagem {name} adicionada com sucesso!')
        except Exception as e:
            pdf.set_font('Arial', '', 10)
            pdf.cell(0, 10, f'Erro ao carregar {name}: {str(e)}')
            pdf.ln(10)
            print(f'Erro ao adicionar {name}: {e}')
    else:
        print(f'Imagem {name} não encontrada: {path}')

# Salvar PDF
output_path = r'd:\Documentos\ox-field-service\teste_simples.pdf'
pdf.output(output_path)
print(f'PDF salvo em: {output_path}')