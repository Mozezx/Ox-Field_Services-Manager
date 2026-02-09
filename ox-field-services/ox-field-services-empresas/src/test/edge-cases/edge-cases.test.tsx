/**
 * Edge Cases Test Suite
 * Tests: EDGE-001 to EDGE-008
 * 
 * Tests edge cases and error handling in real components:
 * - API timeouts and errors
 * - Fallback data handling
 * - Empty states
 * - Special input handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '../utils';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../mocks/server';
import { AppView } from '../../../types';

// Import REAL components
import { OperationsDashboard } from '../../../views/DashboardViews';
import { ApprovalInbox, DocumentVerification } from '../../../views/ApprovalViews';
import { DispatchConsole } from '../../../views/DispatchViews';
import { MySubscriptionView, InvoicesView, CreditsView } from '../../../views/BillingViews';

describe('Edge Cases - Real Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * EDGE-001: API Timeout Handling
   */
  describe('EDGE-001: API Timeout', () => {
    it('should handle slow API responses gracefully', async () => {
      server.use(
        http.get('*/empresa/dashboard', async () => {
          await delay(3000); // 3 second delay
          return HttpResponse.json({
            totalJobs: 100,
            totalJobsChange: 5,
            revenue: 10000,
            revenueChange: 2,
            avgResponseTime: 30,
            avgResponseTimeChange: -1,
            activeTechnicians: 10,
            totalTechnicians: 15,
            utilizationRate: 66,
          });
        })
      );

      render(<OperationsDashboard />);

      // Should show loading initially
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  /**
   * EDGE-002: API Error with Fallback
   */
  describe('EDGE-002: API Error with Fallback', () => {
    it('should use fallback data when dashboard API fails', async () => {
      server.use(
        http.get('*/empresa/dashboard', () => {
          return new HttpResponse(null, { status: 500 });
        }),
        http.get('*/empresa/dashboard/weekly-jobs', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<OperationsDashboard />);

      // Should use fallback data (1284 from component's fallbackDashboard)
      await waitFor(() => {
        expect(screen.getByText(/1[,.]284/)).toBeInTheDocument();
      });
    });

    it('should show error notification for approval inbox', async () => {
      const mockSetView = vi.fn();
      
      server.use(
        http.get('*/empresa/technicians', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // Component shows "Using cached data - API unavailable" on error
        expect(screen.getByText(/Using cached data|API unavailable/)).toBeInTheDocument();
      });
    });
  });

  /**
   * EDGE-003: Empty States
   */
  describe('EDGE-003: Empty States', () => {
    it('should show empty state in dispatch when no technicians', async () => {
      server.use(
        http.get('*/empresa/dispatch/calendar', () => {
          return HttpResponse.json([]);
        }),
        http.get('*/empresa/dispatch/unassigned', () => {
          return HttpResponse.json([]);
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('No technicians available')).toBeInTheDocument();
        expect(screen.getByText('No unassigned orders')).toBeInTheDocument();
      });
    });

    it('should show empty state for invoices', async () => {
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
   * EDGE-004: Concurrent Operations
   */
  describe('EDGE-004: Concurrent Operations', () => {
    it('should handle rapid view mode switches', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Day')).toBeInTheDocument();
      });

      // Rapid switching
      await user.click(screen.getByText('Week'));
      await user.click(screen.getByText('Month'));
      await user.click(screen.getByText('Day'));

      // Should end on Day view
      await waitFor(() => {
        const dayButton = screen.getByText('Day');
        expect(dayButton.closest('button')).toHaveClass('bg-surface-dark');
      });
    });
  });

  /**
   * EDGE-005: Large Data Sets
   */
  describe('EDGE-005: Large Data Sets', () => {
    it('should handle many technicians', async () => {
      const manyTechnicians = Array.from({ length: 50 }, (_, i) => ({
        technicianId: `tech-${i}`,
        technicianName: `Technician ${i}`,
        skills: ['Skill A'],
        isOnline: i % 2 === 0,
        orders: [],
      }));

      server.use(
        http.get('*/empresa/dispatch/calendar', () => {
          return HttpResponse.json(manyTechnicians);
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Technician 0')).toBeInTheDocument();
        expect(screen.getByText('Technician 49')).toBeInTheDocument();
      });
    });
  });

  /**
   * EDGE-006: Special Characters in Input
   */
  describe('EDGE-006: Special Characters', () => {
    it('should handle special characters in search', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search Technicians/)).toBeInTheDocument();
      });

      // Type special characters
      const searchInput = screen.getByPlaceholderText(/Search Technicians/);
      await user.type(searchInput, '<script>alert(1)</script>');

      // Should not break and show no results
      await waitFor(() => {
        expect(screen.getByText('No technicians found')).toBeInTheDocument();
      });
    });

    it('should handle unicode in search', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search Technicians/)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search Technicians/);
      await user.type(searchInput, 'José María');

      // Should not break
      expect(searchInput).toHaveValue('José María');
    });
  });

  /**
   * EDGE-007: Form Validation in Real Components
   */
  describe('EDGE-007: Form Validation', () => {
    it('should require rejection reason in verification', async () => {
      const user = userEvent.setup();
      const mockSetView = vi.fn();
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reject with Comment'));

      await waitFor(() => {
        expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
      });

      // Try to confirm without reason
      await user.click(screen.getByText('Confirm Rejection'));

      expect(alertMock).toHaveBeenCalledWith('Please select a rejection reason.');
      alertMock.mockRestore();
    });

    it('should validate new order form', async () => {
      const user = userEvent.setup();
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        expect(screen.getByText('Create Order')).toBeInTheDocument();
      });

      // Try to submit empty form
      await user.click(screen.getByText('Create Order'));

      expect(alertMock).toHaveBeenCalledWith('Please fill in required fields');
      alertMock.mockRestore();
    });
  });

  /**
   * EDGE-008: Subscription Error States
   */
  describe('EDGE-008: Subscription Error States', () => {
    it('should display error when subscription fails to load', async () => {
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
});
