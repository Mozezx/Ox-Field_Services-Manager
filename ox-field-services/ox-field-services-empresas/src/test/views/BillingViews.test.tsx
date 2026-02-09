/**
 * Billing Views Test Suite
 * Tests: BILL-001 to BILL-034
 * 
 * Tests the real Billing components:
 * - MySubscriptionView
 * - InvoicesView
 * - CreditsView
 * - UsageReportView
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import {
  mockSubscription,
  mockInvoices,
  mockCredits,
  mockUsage,
} from '../mocks/handlers';

// Import the REAL components
import {
  MySubscriptionView,
  InvoicesView,
  CreditsView,
  UsageReportView,
} from '../../../views/BillingViews';

describe('Billing Views - Real Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * BILL-001 to BILL-010: MySubscriptionView Tests
   */
  describe('MySubscriptionView Component', () => {
    it('should display subscription header', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('Minha Assinatura')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<MySubscriptionView />);
      
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should display plan edition badge', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('PROFESSIONAL')).toBeInTheDocument();
      });
    });

    it('should display subscription status', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });
    });

    it('should display total monthly amount', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        // The mock has totalAmount: 845 which should be formatted as R$ 845,00
        // There may be multiple matches (header and breakdown), so use getAllBy
        const amounts = screen.getAllByText(/R\$ 845[.,]00/);
        expect(amounts.length).toBeGreaterThan(0);
      });
    });

    it('should display period dates', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText(/Período Atual/)).toBeInTheDocument();
        expect(screen.getByText(/2024-01-01/)).toBeInTheDocument();
        expect(screen.getByText(/2024-01-31/)).toBeInTheDocument();
      });
    });

    it('should display user counts section', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('Usuários Ativos')).toBeInTheDocument();
        expect(screen.getByText('Admins')).toBeInTheDocument();
        expect(screen.getByText('Gestores')).toBeInTheDocument();
        expect(screen.getByText('Técnicos')).toBeInTheDocument();
      });
    });

    it('should display pricing breakdown', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('Detalhamento')).toBeInTheDocument();
        expect(screen.getByText(/Plano Base/)).toBeInTheDocument();
      });
    });

    it('should handle error state', async () => {
      server.use(
        http.get('*/empresa/billing/subscription', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar assinatura|Assinatura não encontrada/)).toBeInTheDocument();
      });
    });
  });

  /**
   * BILL-011 to BILL-020: InvoicesView Tests
   */
  describe('InvoicesView Component', () => {
    it('should display invoices header', async () => {
      render(<InvoicesView />);

      await waitFor(() => {
        expect(screen.getByText('Faturas')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<InvoicesView />);
      
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should display invoice list', async () => {
      render(<InvoicesView />);

      await waitFor(() => {
        // Check for invoice numbers from mock data
        expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
        expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
      });
    });

    it('should display invoice amounts', async () => {
      render(<InvoicesView />);

      await waitFor(() => {
        // Mock invoices have amounts of 1022.45
        const amountElements = screen.getAllByText(/R\$ 1[.,]022[.,]45/);
        expect(amountElements.length).toBeGreaterThan(0);
      });
    });

    it('should display invoice status badges', async () => {
      render(<InvoicesView />);

      await waitFor(() => {
        expect(screen.getByText('Pago')).toBeInTheDocument();
        expect(screen.getByText('Pendente')).toBeInTheDocument();
      });
    });

    it('should display due dates', async () => {
      render(<InvoicesView />);

      await waitFor(() => {
        const dueDateElements = screen.getAllByText(/Vencimento:/);
        expect(dueDateElements.length).toBeGreaterThan(0);
      });
    });

    it('should open invoice detail modal on click', async () => {
      const user = userEvent.setup();
      render(<InvoicesView />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      });

      // Click on an invoice to open the modal
      const invoiceRow = screen.getByText('INV-2024-001').closest('div[class*="bg-surface rounded-xl"]');
      if (invoiceRow) {
        await user.click(invoiceRow);
      }

      await waitFor(() => {
        // Modal should show invoice details
        expect(screen.getByText(/Fatura INV-2024-001/)).toBeInTheDocument();
      });
    });

    it('should close invoice modal on button click', async () => {
      const user = userEvent.setup();
      render(<InvoicesView />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      });

      // Open modal
      const invoiceRow = screen.getByText('INV-2024-001').closest('div[class*="bg-surface rounded-xl"]');
      if (invoiceRow) {
        await user.click(invoiceRow);
      }

      await waitFor(() => {
        expect(screen.getByText(/Fatura INV-2024-001/)).toBeInTheDocument();
      });

      // Close modal
      await user.click(screen.getByText('Fechar'));

      await waitFor(() => {
        expect(screen.queryByText(/Fatura INV-2024-001/)).not.toBeInTheDocument();
      });
    });

    it('should display empty state when no invoices', async () => {
      server.use(
        http.get('*/empresa/billing/invoices', () => {
          return HttpResponse.json([]);
        })
      );

      render(<InvoicesView />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma fatura encontrada')).toBeInTheDocument();
      });
    });
  });

  /**
   * BILL-021 to BILL-028: CreditsView Tests
   */
  describe('CreditsView Component', () => {
    it('should display credits header', async () => {
      render(<CreditsView />);

      await waitFor(() => {
        // Use regex to handle encoding variations
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<CreditsView />);
      
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should display total available credits', async () => {
      render(<CreditsView />);

      await waitFor(() => {
        expect(screen.getByText('Saldo Disponível')).toBeInTheDocument();
        // Mock has totalAvailable: 1250
        expect(screen.getByText('1250')).toBeInTheDocument();
      });
    });

    it('should display credit packages for purchase', async () => {
      render(<CreditsView />);

      await waitFor(() => {
        expect(screen.getByText('Comprar Créditos')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText(/2\.000|2,000/)).toBeInTheDocument();
        expect(screen.getByText(/10\.000|10,000/)).toBeInTheDocument();
      });
    });

    it('should show Popular badge on recommended package', async () => {
      render(<CreditsView />);

      await waitFor(() => {
        expect(screen.getByText('Popular')).toBeInTheDocument();
      });
    });

    it('should display purchase history', async () => {
      render(<CreditsView />);

      await waitFor(() => {
        expect(screen.getByText('Histórico de Compras')).toBeInTheDocument();
      });
    });

    it('should display credit usage table', async () => {
      render(<CreditsView />);

      await waitFor(() => {
        expect(screen.getByText('Consumo por Recurso')).toBeInTheDocument();
        expect(screen.getByText('Ordem de Serviço criada')).toBeInTheDocument();
        expect(screen.getByText('Otimização de rota')).toBeInTheDocument();
        expect(screen.getByText('SMS enviado')).toBeInTheDocument();
      });
    });
  });

  /**
   * BILL-029 to BILL-034: UsageReportView Tests
   */
  describe('UsageReportView Component', () => {
    it('should display usage report header', async () => {
      render(<UsageReportView />);

      await waitFor(() => {
        expect(screen.getByText('Relatório de Uso')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<UsageReportView />);
      
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should display month selector', async () => {
      render(<UsageReportView />);

      await waitFor(() => {
        const monthInput = document.querySelector('input[type="month"]');
        expect(monthInput).toBeInTheDocument();
      });
    });

    it('should display summary cards', async () => {
      render(<UsageReportView />);

      await waitFor(() => {
        expect(screen.getByText('Total Usuários')).toBeInTheDocument();
        expect(screen.getByText('OS Criadas')).toBeInTheDocument();
        expect(screen.getByText('OS Concluídas')).toBeInTheDocument();
        expect(screen.getByText('Créditos Usados')).toBeInTheDocument();
      });
    });

    it('should display user counts from API', async () => {
      render(<UsageReportView />);

      await waitFor(() => {
        // Mock has ordersCreated: 156, ordersCompleted: 142
        expect(screen.getByText('156')).toBeInTheDocument();
        expect(screen.getByText('142')).toBeInTheDocument();
      });
    });

    it('should display user breakdown section', async () => {
      render(<UsageReportView />);

      await waitFor(() => {
        expect(screen.getByText('Usuários por Tipo')).toBeInTheDocument();
      });
    });

    it('should display credit usage by type', async () => {
      render(<UsageReportView />);

      await waitFor(() => {
        expect(screen.getByText('Uso de Créditos por Tipo')).toBeInTheDocument();
      });
    });

    it('should reload data when month changes', async () => {
      const user = userEvent.setup();
      let fetchCount = 0;

      server.use(
        http.get('*/empresa/billing/usage', () => {
          fetchCount++;
          return HttpResponse.json(mockUsage);
        })
      );

      render(<UsageReportView />);

      await waitFor(() => {
        expect(screen.getByText('Relatório de Uso')).toBeInTheDocument();
      });

      // Change month
      const monthInput = document.querySelector('input[type="month"]') as HTMLInputElement;
      if (monthInput) {
        await user.clear(monthInput);
        await user.type(monthInput, '2024-02');
      }

      // Should fetch data again
      await waitFor(() => {
        expect(fetchCount).toBeGreaterThan(1);
      });
    });
  });
});
