/**
 * E2E Critical Flows Test Suite
 * Tests: E2E-001 to E2E-004
 * 
 * Tests critical user flows using real components:
 * - Technician approval workflow
 * - Order creation and assignment
 * - Dashboard data integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockDashboardData, mockTechnicians, mockOrders } from '../mocks/handlers';
import { AppView } from '../../../types';

// Import REAL components
import { OperationsDashboard } from '../../../views/DashboardViews';
import { ApprovalInbox, DocumentVerification } from '../../../views/ApprovalViews';
import { DispatchConsole } from '../../../views/DispatchViews';
import { MySubscriptionView } from '../../../views/BillingViews';

describe('E2E Critical Flows - Real Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * E2E-001: Technician Approval Complete Flow
   * Tests the full flow from viewing pending technicians to approving one
   */
  describe('E2E-001: Technician Approval Flow', () => {
    it('should display pending technicians in inbox', async () => {
      const mockSetView = vi.fn();
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Technician Approvals')).toBeInTheDocument();
        expect(screen.getByText('David Miller')).toBeInTheDocument();
      });
    });

    it('should navigate to verification when clicking pending technician', async () => {
      const user = userEvent.setup();
      const mockSetView = vi.fn();
      
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('David Miller')).toBeInTheDocument();
      });

      const davidRow = screen.getByText('David Miller').closest('div[class*="grid grid-cols-12"]');
      if (davidRow) {
        await user.click(davidRow);
      }

      expect(mockSetView).toHaveBeenCalledWith(AppView.APPROVALS_VERIFICATION);
    });

    it('should approve technician from verification screen', async () => {
      const user = userEvent.setup();
      const mockSetView = vi.fn();
      let approvalCalled = false;

      server.use(
        http.patch('*/empresa/technicians/:id/status', async ({ request }) => {
          const body = await request.json() as { status: string };
          if (body.status === 'APPROVED') {
            approvalCalled = true;
          }
          return HttpResponse.json({ ...mockTechnicians[0], status: 'APPROVED' });
        })
      );

      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Approve Application')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Approve Application'));

      await waitFor(() => {
        expect(approvalCalled).toBe(true);
        expect(mockSetView).toHaveBeenCalledWith(AppView.APPROVALS);
      });
    });
  });

  /**
   * E2E-002: Order Lifecycle Flow
   * Tests creating and viewing orders
   */
  describe('E2E-002: Order Lifecycle', () => {
    it('should display scheduled orders in dispatch console', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('HVAC Repair')).toBeInTheDocument();
        expect(screen.getByText('Industrial Corp')).toBeInTheDocument();
      });
    });

    it('should open new order modal', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        expect(screen.getByText('New Service Order')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. HVAC Repair')).toBeInTheDocument();
      });
    });

    it('should create new order via form', async () => {
      const user = userEvent.setup();
      let orderCreated = false;

      server.use(
        http.post('*/empresa/orders', async () => {
          orderCreated = true;
          return HttpResponse.json({
            id: 'new-order',
            orderNumber: 'OS-NEW',
            title: 'Test Order',
            status: 'SCHEDULED',
          });
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. HVAC Repair')).toBeInTheDocument();
      });

      // Fill in the form
      await user.type(screen.getByPlaceholderText('e.g. HVAC Repair'), 'Test Order');
      await user.type(screen.getByPlaceholderText('Customer name'), 'Test Customer');

      // Submit the form
      await user.click(screen.getByText('Create Order'));

      await waitFor(() => {
        expect(orderCreated).toBe(true);
      });
    });
  });

  /**
   * E2E-003: Dashboard Integration
   * Tests that dashboard displays correct KPIs
   */
  describe('E2E-003: Dashboard Integration', () => {
    it('should load and display all KPIs', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Operations & KPI Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Total Jobs')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
      });
    });

    it('should show correct job count from API', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        // Mock data has 1284 jobs
        expect(screen.getByText(/1[,.]284/)).toBeInTheDocument();
      });
    });

    it('should display active technicians correctly', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        // Mock data has 24/30 technicians
        expect(screen.getByText('24/30')).toBeInTheDocument();
        expect(screen.getByText(/80% Utilization/)).toBeInTheDocument();
      });
    });
  });

  /**
   * E2E-004: Billing Flow
   * Tests subscription and billing information display
   */
  describe('E2E-004: Billing Flow', () => {
    it('should display subscription information', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('Minha Assinatura')).toBeInTheDocument();
        expect(screen.getByText('PROFESSIONAL')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });
    });

    it('should show user counts', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('Admins')).toBeInTheDocument();
        expect(screen.getByText('Gestores')).toBeInTheDocument();
      });
    });
  });

  /**
   * Cross-Component Navigation Test
   */
  describe('Cross-Component Data Consistency', () => {
    it('should show consistent technician data across components', async () => {
      const mockSetView = vi.fn();
      
      // Render approval inbox
      const { unmount } = render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('David Miller')).toBeInTheDocument();
      });

      unmount();

      // Render dispatch console
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('David Miller')).toBeInTheDocument();
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
      });
    });
  });
});
