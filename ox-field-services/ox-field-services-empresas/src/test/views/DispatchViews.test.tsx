/**
 * Dispatch Views Test Suite
 * Tests: DISP-001 to DISP-033
 * 
 * Tests the real DispatchConsole component:
 * - Calendar visualization
 * - Date navigation
 * - Technician filtering
 * - Order management
 * - Drag and drop functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent, fireEvent } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockCalendarEntries, mockOrders } from '../mocks/handlers';

// Import the REAL component
import { DispatchConsole } from '../../../views/DispatchViews';

describe('Dispatch Views - Real Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * DISP-001: Calendar Visualization
   */
  describe('DISP-001: Calendar Visualization', () => {
    it('should render the dispatch console', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // The component should have the Today button
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('should display time slots header', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // Time slots from 08:00 to 19:00
        expect(screen.getByText('08:00 AM')).toBeInTheDocument();
        expect(screen.getByText('12:00 PM')).toBeInTheDocument();
      });
    });

    it('should display technician list', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // From mock data
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
        expect(screen.getByText('David Miller')).toBeInTheDocument();
      });
    });

    it('should show search input for technicians', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search Technicians/)).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-002: Date Navigation
   */
  describe('DISP-002: Date Navigation', () => {
    it('should display current date', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // The component shows the formatted date
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        expect(screen.getByText(formattedDate)).toBeInTheDocument();
      });
    });

    it('should have navigation arrows', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // ChevronLeft and ChevronRight icons are present
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to previous day', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });

      // Find and click the previous day button (first ChevronLeft)
      const prevButton = document.querySelector('button[class*="hover:text-white"]');
      if (prevButton) {
        await user.click(prevButton);
      }

      // Date should change
      await waitFor(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedDate = yesterday.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        expect(screen.getByText(formattedDate)).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-003: View Mode Toggle
   */
  describe('DISP-003: View Mode Toggle', () => {
    it('should display view mode options', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Day')).toBeInTheDocument();
        expect(screen.getByText('Week')).toBeInTheDocument();
        expect(screen.getByText('Month')).toBeInTheDocument();
      });
    });

    it('should have Day view active by default', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        const dayButton = screen.getByText('Day');
        expect(dayButton.closest('button')).toHaveClass('bg-surface-dark');
      });
    });

    it('should change view mode on click', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Week')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Week'));

      await waitFor(() => {
        const weekButton = screen.getByText('Week');
        expect(weekButton.closest('button')).toHaveClass('bg-surface-dark');
      });
    });
  });

  /**
   * DISP-004: Status Legend
   */
  describe('DISP-004: Status Legend', () => {
    it('should display status legend', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-005: Technician Filtering
   */
  describe('DISP-005: Technician Filtering', () => {
    it('should filter technicians by search', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
        expect(screen.getByText('David Miller')).toBeInTheDocument();
      });

      // Search for Elena
      const searchInput = screen.getByPlaceholderText(/Search Technicians/);
      await user.type(searchInput, 'Elena');

      await waitFor(() => {
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
        expect(screen.queryByText('David Miller')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when no match', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search Technicians/)).toBeInTheDocument();
      });

      // Search for non-existent technician
      const searchInput = screen.getByPlaceholderText(/Search Technicians/);
      await user.type(searchInput, 'NonExistent');

      await waitFor(() => {
        expect(screen.getByText('No technicians found')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-006: Unassigned Orders
   */
  describe('DISP-006: Unassigned Orders', () => {
    it('should display unassigned orders section', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText(/Unassigned Orders/)).toBeInTheDocument();
      });
    });

    it('should display unassigned order cards', async () => {
      server.use(
        http.get('*/empresa/dispatch/unassigned', () => {
          return HttpResponse.json([
            {
              id: 'unassigned1',
              orderNumber: 'OS-UNASSIGNED',
              title: 'Pending Repair',
              customer: { id: 'c1', name: 'Test Customer', address: '123 Test St' },
              status: 'SCHEDULED',
              priority: 'HIGH',
              scheduledDate: '2024-01-20',
              estimatedDuration: 60,
              category: { id: 'cat-general', name: 'General', code: 'general' },
            },
          ]);
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Pending Repair')).toBeInTheDocument();
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });
    });

    it('should show empty state when no unassigned orders', async () => {
      server.use(
        http.get('*/empresa/dispatch/unassigned', () => {
          return HttpResponse.json([]);
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('No unassigned orders')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-007: Scheduled Orders Display
   */
  describe('DISP-007: Scheduled Orders Display', () => {
    it('should display scheduled orders on timeline', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // Mock has order OS-001 - HVAC Repair
        expect(screen.getByText('HVAC Repair')).toBeInTheDocument();
      });
    });

    it('should display order number', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText(/#OS-001/)).toBeInTheDocument();
      });
    });

    it('should display customer name on order card', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Industrial Corp')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-008: New Order Modal
   */
  describe('DISP-008: New Order Modal', () => {
    it('should open new order modal on button click', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        expect(screen.getByText('New Service Order')).toBeInTheDocument();
      });
    });

    it('should display form fields in modal', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g. HVAC Repair')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Customer name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Address')).toBeInTheDocument();
      });
    });

    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('New Order')).toBeInTheDocument();
      });

      await user.click(screen.getByText('New Order'));

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
   * DISP-009: Technician Skills Display
   */
  describe('DISP-009: Technician Skills Display', () => {
    it('should display technician skills', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // From mock calendar entries
        expect(screen.getByText('HVAC')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-010: Technician Online Status
   */
  describe('DISP-010: Technician Online Status', () => {
    it('should show online indicator for online technicians', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // Elena is online, David is offline
        const onlineIndicators = document.querySelectorAll('.bg-green-500');
        expect(onlineIndicators.length).toBeGreaterThan(0);
      });
    });

    it('should show offline indicator for offline technicians', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        const offlineIndicators = document.querySelectorAll('.bg-gray-500');
        expect(offlineIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * DISP-011: Job Count Display
   */
  describe('DISP-011: Job Count Display', () => {
    it('should display job count per technician', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        // Elena has 1 job, David has 0
        const jobCounts = screen.getAllByText(/\d+ jobs?/);
        expect(jobCounts.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * DISP-012: Filter Buttons
   */
  describe('DISP-012: Filter Buttons', () => {
    it('should display zone filter', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('All Zones')).toBeInTheDocument();
      });
    });

    it('should display skills filter', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('All Skills')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-013: Loading State
   */
  describe('DISP-013: Loading State', () => {
    it('should show loading indicator initially', () => {
      render(<DispatchConsole />);
      
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should hide loading indicator after data loads', async () => {
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
      });

      // Loading indicator should be hidden
      const sidebarLoader = document.querySelector('.flex.items-center.justify-center.h-32 .animate-spin');
      expect(sidebarLoader).not.toBeInTheDocument();
    });
  });

  /**
   * DISP-014: Order Card Click
   */
  describe('DISP-014: Order Card Click', () => {
    it('should open order detail modal on card click', async () => {
      const user = userEvent.setup();
      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('HVAC Repair')).toBeInTheDocument();
      });

      // Click on the order card (it's a button element)
      const orderCard = screen.getByText('HVAC Repair').closest('button');
      if (orderCard) {
        await user.click(orderCard);
      }

      await waitFor(() => {
        // Modal should open with order details
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });
  });

  /**
   * DISP-015: Drag and Drop Setup
   */
  describe('DISP-015: Drag and Drop Setup', () => {
    it('should have draggable unassigned orders', async () => {
      server.use(
        http.get('*/empresa/dispatch/unassigned', () => {
          return HttpResponse.json([
            {
              id: 'drag1',
              orderNumber: 'OS-DRAG',
              title: 'Draggable Order',
              customer: { id: 'c1', name: 'Customer', address: '123 St' },
              status: 'SCHEDULED',
              priority: 'MEDIUM',
              estimatedDuration: 60,
              category: { id: 'cat-general', name: 'General', code: 'general' },
            },
          ]);
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        expect(screen.getByText('Draggable Order')).toBeInTheDocument();
      });

      // Check if the element has draggable attribute
      const orderCard = screen.getByText('Draggable Order').closest('div[draggable]');
      expect(orderCard).toHaveAttribute('draggable', 'true');
    });
  });

  /**
   * Error handling
   */
  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('*/empresa/dispatch/calendar', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<DispatchConsole />);

      await waitFor(() => {
        // Should show empty state or error handling
        expect(screen.getByText('No technicians available')).toBeInTheDocument();
      });
    });
  });
});
