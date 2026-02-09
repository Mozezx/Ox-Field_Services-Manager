/**
 * Performance Test Suite
 * Tests: PERF-001 to PERF-004
 * 
 * Tests performance characteristics of real components:
 * - Component render times
 * - Large data handling
 * - Interaction responsiveness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

// Import REAL components
import { OperationsDashboard } from '../../../views/DashboardViews';
import { DispatchConsole } from '../../../views/DispatchViews';
import { InvoicesView } from '../../../views/BillingViews';

describe('Performance Tests - Real Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * PERF-001: Dashboard Load Time
   */
  describe('PERF-001: Dashboard Load Time', () => {
    it('should render dashboard quickly', async () => {
      const startTime = performance.now();
      
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Operations & KPI Dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Dashboard should render in less than 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    it('should display KPIs within reasonable time', async () => {
      const startTime = performance.now();

      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/1[,.]284/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // KPIs should load in less than 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
  });

  /**
   * PERF-002: Dispatch Console with Many Technicians
   */
  describe('PERF-002: Dispatch Console Performance', () => {
    it('should handle 50 technicians efficiently', async () => {
      const manyTechnicians = Array.from({ length: 50 }, (_, i) => ({
        technicianId: `tech-${i}`,
        technicianName: `Technician ${i}`,
        technicianAvatar: `https://picsum.photos/seed/tech${i}/60/60`,
        skills: ['Skill A', 'Skill B'],
        isOnline: i % 2 === 0,
        orders: [],
      }));

      server.use(
        http.get('*/empresa/dispatch/calendar', () => {
          return HttpResponse.json(manyTechnicians);
        })
      );

      const startTime = performance.now();

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Technician 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 3 seconds even with 50 technicians
      expect(renderTime).toBeLessThan(3000);
    });

    it('should handle many orders per technician', async () => {
      const orders = Array.from({ length: 8 }, (_, i) => ({
        id: `order-${i}`,
        orderNumber: `OS-${i}`,
        title: `Order ${i}`,
        customer: { id: 'c1', name: 'Customer', address: '123 St' },
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        scheduledDate: '2024-01-20',
        scheduledStartTime: `${8 + i}:00`,
        estimatedDuration: 60,
        category: { id: 'cat-general', name: 'General', code: 'general' },
      }));

      server.use(
        http.get('*/empresa/dispatch/calendar', () => {
          return HttpResponse.json([
            {
              technicianId: 'tech-1',
              technicianName: 'Busy Tech',
              skills: ['All'],
              isOnline: true,
              orders: orders,
            },
          ]);
        })
      );

      const startTime = performance.now();

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Busy Tech')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 3 seconds
      expect(renderTime).toBeLessThan(3000);
    });
  });

  /**
   * PERF-003: Search Filter Performance
   */
  describe('PERF-003: Search Filter Performance', () => {
    it('should filter technicians quickly', async () => {
      const user = userEvent.setup();
      
      const manyTechnicians = Array.from({ length: 30 }, (_, i) => ({
        technicianId: `tech-${i}`,
        technicianName: `Technician ${i}`,
        skills: ['Skill'],
        isOnline: true,
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
      });

      const searchInput = screen.getByPlaceholderText(/Search Technicians/);
      
      const startTime = performance.now();
      await user.type(searchInput, 'Technician 15');
      
      await waitFor(() => {
        expect(screen.getByText('Technician 15')).toBeInTheDocument();
        expect(screen.queryByText('Technician 0')).not.toBeInTheDocument();
      });

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Filtering should be reasonably fast (less than 2 seconds in test environment)
      expect(filterTime).toBeLessThan(2000);
    });
  });

  /**
   * PERF-004: View Mode Switching
   */
  describe('PERF-004: View Mode Switching', () => {
    it('should switch view modes quickly', async () => {
      const user = userEvent.setup();
      
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Day')).toBeInTheDocument();
      });

      const startTime = performance.now();
      
      await user.click(screen.getByText('Week'));

      await waitFor(() => {
        const weekButton = screen.getByText('Week');
        expect(weekButton.closest('button')).toHaveClass('bg-surface-dark');
      });

      const endTime = performance.now();
      const switchTime = endTime - startTime;

      // View mode switch should be fast (less than 500ms in test environment)
      expect(switchTime).toBeLessThan(500);
    });
  });

  /**
   * PERF-005: Invoice List Performance
   */
  describe('PERF-005: Invoice List Performance', () => {
    it('should render many invoices efficiently', async () => {
      const manyInvoices = Array.from({ length: 50 }, (_, i) => ({
        id: `inv-${i}`,
        invoiceNumber: `INV-2024-${String(i).padStart(3, '0')}`,
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        subtotal: 1000 + i * 10,
        taxAmount: 100,
        totalAmount: 1100 + i * 10,
        status: i % 3 === 0 ? 'PAID' : 'PENDING',
        dueDate: `2024-02-${String((i % 28) + 1).padStart(2, '0')}`,
        lines: [],
      }));

      server.use(
        http.get('*/empresa/billing/invoices', () => {
          return HttpResponse.json(manyInvoices);
        })
      );

      const startTime = performance.now();

      render(<InvoicesView />);

      await waitFor(() => {
        expect(screen.getByText('INV-2024-000')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 50 invoices in less than 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });
  });

  /**
   * Memory cleanup verification
   */
  describe('Memory Management', () => {
    it('should cleanup after unmount', async () => {
      const { unmount } = render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });
});
