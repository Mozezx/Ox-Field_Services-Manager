/**
 * Approval Views Test Suite
 * Tests: APPR-001 to APPR-035
 * 
 * Tests the real ApprovalInbox and DocumentVerification components:
 * - Approval inbox display and counters
 * - Document verification flow
 * - Approve/Reject actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, userEvent } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockTechnicians } from '../mocks/handlers';
import { AppView } from '../../../types';

// Import the REAL components
import { ApprovalInbox, DocumentVerification } from '../../../views/ApprovalViews';

describe('Approval Views - Real Components', () => {
  const mockSetView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * APPR-001: Inbox de aprovação
   * Verifica a listagem de técnicos pendentes
   */
  describe('APPR-001: Approval Inbox', () => {
    it('should display the approval inbox header', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Technician Approvals')).toBeInTheDocument();
      });
    });

    it('should show technician list after loading', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // Check for technician names from mock data
        expect(screen.getByText('David Miller')).toBeInTheDocument();
        expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
      });
    });

    it('should display technician emails', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('david@example.com')).toBeInTheDocument();
        expect(screen.getByText('elena@example.com')).toBeInTheDocument();
      });
    });

    it('should display technician roles', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // The component displays 'role' field from mock data
        // Check that at least one role is displayed
        const roleElements = screen.getAllByText(/Electrician|Plumber|Courier/);
        expect(roleElements.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * APPR-002: Counters de status
   * Verifica os contadores de pendentes e urgentes
   */
  describe('APPR-002: Status Counters', () => {
    it('should display pending count badge', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('should display urgent count badge', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Urgent')).toBeInTheDocument();
      });
    });

    it('should show correct pending count', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // The mock has 2 PENDING technicians
        const pendingBadge = screen.getAllByText('2');
        expect(pendingBadge.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * APPR-003: Status badges
   * Verifica a exibição correta dos status
   */
  describe('APPR-003: Status Badges', () => {
    it('should display Needs Review for pending technicians', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        const needsReviewBadges = screen.getAllByText('Needs Review');
        expect(needsReviewBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display Rejected status for rejected technicians', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Rejected')).toBeInTheDocument();
      });
    });
  });

  /**
   * APPR-004: Click navigation
   * Verifica navegação ao clicar em técnico
   */
  describe('APPR-004: Click Navigation', () => {
    it('should call setView when clicking a pending technician', async () => {
      const user = userEvent.setup();
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('David Miller')).toBeInTheDocument();
      });

      // Click on the technician row (the row is clickable)
      const davidRow = screen.getByText('David Miller').closest('div[class*="grid grid-cols-12"]');
      if (davidRow) {
        await user.click(davidRow);
      }

      expect(mockSetView).toHaveBeenCalledWith(AppView.APPROVALS_VERIFICATION);
    });

    it('should not navigate when clicking rejected technician', async () => {
      const user = userEvent.setup();
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Sam Bridges')).toBeInTheDocument();
      });

      // Click on Sam Bridges (REJECTED status)
      const samRow = screen.getByText('Sam Bridges').closest('div[class*="grid grid-cols-12"]');
      if (samRow) {
        await user.click(samRow);
      }

      // Should not navigate for rejected technician
      expect(mockSetView).not.toHaveBeenCalled();
    });
  });

  /**
   * APPR-005: Loading state
   * Verifica indicador de carregamento
   */
  describe('APPR-005: Loading State', () => {
    it('should show loading indicator initially', () => {
      render(<ApprovalInbox setView={mockSetView} />);
      
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  /**
   * APPR-006: Error handling with fallback
   */
  describe('APPR-006: Error Handling', () => {
    it('should show error message when API fails', async () => {
      server.use(
        http.get('*/empresa/technicians', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // The component falls back to mock data and shows error
        expect(screen.getByText(/Using cached data|API unavailable/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * Document Verification Tests
   */
  describe('Document Verification Component', () => {
    /**
     * APPR-010: Verification header
     */
    it('should display verification header with back button', async () => {
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText(/Verification:/)).toBeInTheDocument();
      });
    });

    /**
     * APPR-011: Action buttons
     */
    it('should display approve and reject buttons', async () => {
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Approve Application')).toBeInTheDocument();
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });
    });

    /**
     * APPR-012: Validation checklist
     */
    it('should display validation checklist items', async () => {
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Validation Checklist')).toBeInTheDocument();
        expect(screen.getByText('Identity Match')).toBeInTheDocument();
        expect(screen.getByText('Expiration Check')).toBeInTheDocument();
      });
    });

    /**
     * APPR-013: Document viewer
     */
    it('should render document viewer area', async () => {
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('CERTIFICATE')).toBeInTheDocument();
      });
    });

    /**
     * APPR-014: Internal notes textarea
     */
    it('should have internal notes textarea', async () => {
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Internal Notes')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Add notes about this verification/)).toBeInTheDocument();
      });
    });

    /**
     * APPR-015: Back button navigation
     */
    it('should navigate back when clicking back button', async () => {
      const user = userEvent.setup();
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText(/Verification:/)).toBeInTheDocument();
      });

      // Find and click the back button (ArrowLeft icon button)
      const backButton = document.querySelector('button[class*="rounded-full"]');
      if (backButton) {
        await user.click(backButton);
        expect(mockSetView).toHaveBeenCalledWith(AppView.APPROVALS);
      }
    });

    /**
     * APPR-020: Approve action
     */
    it('should call API and navigate when approving', async () => {
      const user = userEvent.setup();
      let apiCalled = false;

      server.use(
        http.patch('*/empresa/technicians/:id/status', async ({ request }) => {
          const body = await request.json() as { status: string };
          if (body.status === 'APPROVED') {
            apiCalled = true;
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
        expect(apiCalled).toBe(true);
        expect(mockSetView).toHaveBeenCalledWith(AppView.APPROVALS);
      });
    });

    /**
     * APPR-025: Rejection modal
     */
    it('should open rejection modal when clicking reject button', async () => {
      const user = userEvent.setup();
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reject with Comment'));

      await waitFor(() => {
        expect(screen.getByText('Reject Document')).toBeInTheDocument();
        expect(screen.getByText('Image is blurry or unreadable')).toBeInTheDocument();
      });
    });

    /**
     * APPR-026: Rejection reasons
     */
    it('should display all rejection reason options', async () => {
      const user = userEvent.setup();
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reject with Comment'));

      await waitFor(() => {
        expect(screen.getByText('Image is blurry or unreadable')).toBeInTheDocument();
        expect(screen.getByText('Document has expired')).toBeInTheDocument();
        expect(screen.getByText('Name does not match profile')).toBeInTheDocument();
        expect(screen.getByText('Wrong document type')).toBeInTheDocument();
      });
    });

    /**
     * APPR-027: Cancel rejection
     */
    it('should close rejection modal when clicking cancel', async () => {
      const user = userEvent.setup();
      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reject with Comment'));

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        // Modal should be closed
        expect(screen.queryByText('Reject Document')).not.toBeInTheDocument();
      });
    });

    /**
     * APPR-028: Confirm rejection with reason
     */
    it('should require rejection reason before confirming', async () => {
      const user = userEvent.setup();
      
      // Mock alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reject with Comment'));

      await waitFor(() => {
        expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
      });

      // Try to confirm without selecting a reason
      await user.click(screen.getByText('Confirm Rejection'));

      expect(alertMock).toHaveBeenCalledWith('Please select a rejection reason.');
      alertMock.mockRestore();
    });

    /**
     * APPR-029: Submit rejection with reason
     */
    it('should submit rejection when reason is selected', async () => {
      const user = userEvent.setup();
      let rejectionData: { status?: string; notes?: string } = {};

      server.use(
        http.patch('*/empresa/technicians/:id/status', async ({ request }) => {
          rejectionData = await request.json() as typeof rejectionData;
          return HttpResponse.json({ ...mockTechnicians[0], status: 'REJECTED' });
        })
      );

      render(<DocumentVerification setView={mockSetView} />);

      await waitFor(() => {
        expect(screen.getByText('Reject with Comment')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reject with Comment'));

      await waitFor(() => {
        expect(screen.getByText('Image is blurry or unreadable')).toBeInTheDocument();
      });

      // Select a reason
      await user.click(screen.getByText('Image is blurry or unreadable'));

      // Add optional comment
      const commentTextarea = screen.getByPlaceholderText('Provide specific details...');
      await user.type(commentTextarea, 'Poor quality scan');

      // Confirm rejection
      await user.click(screen.getByText('Confirm Rejection'));

      await waitFor(() => {
        expect(rejectionData.status).toBe('REJECTED');
        expect(rejectionData.notes).toContain('Image is blurry or unreadable');
        expect(mockSetView).toHaveBeenCalledWith(AppView.APPROVALS);
      });
    });
  });

  /**
   * Skills display
   */
  describe('Skills Display', () => {
    it('should display technician skills', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // Check for skills from mock data
        expect(screen.getByText('HVAC')).toBeInTheDocument();
      });
    });
  });

  /**
   * Date formatting
   */
  describe('Date Formatting', () => {
    it('should format application dates', async () => {
      render(<ApprovalInbox setView={mockSetView} />);

      await waitFor(() => {
        // The mock data has dates like '2023-10-24', '2023-10-23', '2023-10-20'
        // Check that at least one formatted date is present
        const dateElements = screen.getAllByText(/Oct \d{1,2}, 2023/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });
});
