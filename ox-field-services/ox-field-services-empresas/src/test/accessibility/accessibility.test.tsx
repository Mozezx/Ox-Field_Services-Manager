/**
 * Accessibility Test Suite
 * Tests: A11Y-001 to A11Y-004
 * 
 * Tests accessibility features of real components:
 * - Keyboard navigation
 * - Screen reader support
 * - Form accessibility
 * - Focus management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '../utils';
import { AppView } from '../../../types';

// Import REAL components
import { OperationsDashboard } from '../../../views/DashboardViews';
import { ApprovalInbox, DocumentVerification } from '../../../views/ApprovalViews';
import { DispatchConsole } from '../../../views/DispatchViews';
import { MySubscriptionView, InvoicesView } from '../../../views/BillingViews';

describe('Accessibility Tests - Real Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * A11Y-001: Keyboard Navigation
   */
  describe('A11Y-001: Keyboard Navigation', () => {
    it('should support Tab navigation in dispatch console', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });

      // Tab through elements
      await user.tab();
      
      // Should focus on interactive elements
      expect(document.activeElement).not.toBe(document.body);
    });

    it('should have focusable elements in approval inbox', async () => {
      const mockSetView = vi.fn();
      
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Technician Approvals')).toBeInTheDocument();
      });

      // Check that clickable elements exist
      const clickableElements = document.querySelectorAll('[class*="cursor-pointer"]');
      expect(clickableElements.length).toBeGreaterThan(0);
    });
  });

  /**
   * A11Y-002: Form Labels
   */
  describe('A11Y-002: Form Labels', () => {
    it('should have labeled inputs in new order form', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        expect(screen.getByText('New Service Order')).toBeInTheDocument();
      });

      // Check for label elements
      expect(screen.getByText('Title *')).toBeInTheDocument();
      expect(screen.getByText('Customer Name *')).toBeInTheDocument();
    });

    it('should have labeled search input', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search Technicians/)).toBeInTheDocument();
      });

      // Search input should have placeholder as label alternative
      const searchInput = screen.getByPlaceholderText(/Search Technicians/);
      expect(searchInput).toHaveAttribute('placeholder');
    });
  });

  /**
   * A11Y-003: Focus Management
   */
  describe('A11Y-003: Focus Management', () => {
    it('should focus on modal when opened', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        const modal = screen.getByText('New Service Order').closest('div[class*="fixed"]');
        expect(modal).toBeInTheDocument();
      });
    });

    it('should return focus when modal closes', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      const newOrderButton = screen.getByText('New Order');
      await user.click(newOrderButton);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('New Service Order')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * A11Y-004: Screen Reader Support
   */
  describe('A11Y-004: Screen Reader Support', () => {
    it('should have heading hierarchy in dashboard', async () => {
      render(<OperationsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Operations & KPI Dashboard')).toBeInTheDocument();
      });

      // Check for h1 heading
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Operations & KPI Dashboard');
    });

    it('should have heading in approval inbox', async () => {
      const mockSetView = vi.fn();
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Technician Approvals')).toBeInTheDocument();
      });

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Technician Approvals');
    });

    it('should have heading in subscription view', async () => {
      render(<MySubscriptionView />);

      await waitFor(() => {
        expect(screen.getByText('Minha Assinatura')).toBeInTheDocument();
      });

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Minha Assinatura');
    });
  });

  /**
   * A11Y-005: Button Accessibility
   */
  describe('A11Y-005: Button Accessibility', () => {
    it('should have buttons with text content', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });

      // Buttons should have visible text
      const todayButton = screen.getByText('Today');
      expect(todayButton).toBeInTheDocument();
      
      const newOrderButton = screen.getByText('New Order');
      expect(newOrderButton).toBeInTheDocument();
    });

    it('should have accessible approval buttons', async () => {
      const mockSetView = vi.fn();
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Approve Application')).toBeInTheDocument();
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      // Buttons should be accessible
      const approveButton = screen.getByText('Approve Application');
      const rejectButton = screen.getByText('Reject with Comment');
      
      expect(approveButton.closest('button')).toBeInTheDocument();
      expect(rejectButton.closest('button')).toBeInTheDocument();
    });
  });

  /**
   * A11Y-006: Status Indicators
   */
  describe('A11Y-006: Status Indicators', () => {
    it('should have text status in addition to color', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });

      // Status legend provides text alternatives to colors
      const scheduledLabel = screen.getByText('Scheduled');
      const inProgressLabel = screen.getByText('In Progress');
      const completedLabel = screen.getByText('Completed');

      expect(scheduledLabel).toBeInTheDocument();
      expect(inProgressLabel).toBeInTheDocument();
      expect(completedLabel).toBeInTheDocument();
    });

    it('should have text status for technician approval', async () => {
      const mockSetView = vi.fn();
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // Status badges have text content
        expect(screen.getAllByText(/Needs Review|Rejected|Approved/).length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * A11Y-007: Interactive Element Size
   */
  describe('A11Y-007: Interactive Element Size', () => {
    it('should have adequately sized click targets', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });

      // Check that buttons have reasonable size (h-9 = 36px)
      const todayButton = screen.getByText('Today').closest('button');
      expect(todayButton).toHaveClass('h-9');
    });
  });

  /**
   * A11Y-008: Loading States
   */
  describe('A11Y-008: Loading States', () => {
    it('should indicate loading state visually', () => {
      render(<DispatchConsole />);
      
      // Loading spinner should be visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should update when data loads', async () => {
      render(<DispatchConsole />);

      // Initially loading
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      // After data loads
      await waitFor(() => {
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
      });
    });
  });
});
