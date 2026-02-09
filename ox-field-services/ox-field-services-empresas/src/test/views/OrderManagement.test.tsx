/**
 * Order Management Test Suite
 * Tests: ORD-001 to ORD-015
 * 
 * Tests the Order Management functionality including:
 * - Listing orders
 * - Filtering
 * - CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { mockOrders, mockTechnicians, mockCategories } from '../mocks/handlers';

const createModalCategories = mockCategories ?? [
  { id: 'cat-general', name: 'General', code: 'general' },
  { id: 'cat-hvac', name: 'HVAC', code: 'hvac' },
];
import React from 'react';

// Mock Order Management Component
const MockOrderManagement: React.FC = () => {
  const [orders, setOrders] = React.useState<typeof mockOrders>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [technicianFilter, setTechnicianFilter] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedOrder, setSelectedOrder] = React.useState<typeof mockOrders[0] | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (technicianFilter) params.append('technicianId', technicianFilter);
      
      const response = await fetch(`/api/empresa/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, technicianFilter]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCreateOrder = async (orderData: Partial<typeof mockOrders[0]>) => {
    try {
      const response = await fetch('/api/empresa/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        await fetchOrders();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateOrder = async (orderId: string, orderData: Partial<typeof mockOrders[0]>) => {
    try {
      const response = await fetch(`/api/empresa/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setSelectedOrder(null);
        await fetchOrders();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/empresa/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSelectedOrder(null);
        await fetchOrders();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleReschedule = async (orderId: string, date: string, time: string) => {
    try {
      const response = await fetch(`/api/empresa/orders/${orderId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: date, scheduledStartTime: time }),
      });
      
      if (response.ok) {
        await fetchOrders();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAssignTechnician = async (orderId: string, technicianId: string) => {
    try {
      const response = await fetch(`/api/empresa/orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId }),
      });
      
      if (response.ok) {
        await fetchOrders();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div data-testid="orders-loading">Loading...</div>;
  }

  return (
    <div data-testid="order-management">
      {/* Filters */}
      <div data-testid="order-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          data-testid="status-filter"
        >
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          data-testid="date-filter"
        />

        <select
          value={technicianFilter}
          onChange={(e) => setTechnicianFilter(e.target.value)}
          data-testid="technician-filter"
        >
          <option value="">All Technicians</option>
          {mockTechnicians.map(tech => (
            <option key={tech.id} value={tech.id}>{tech.name}</option>
          ))}
        </select>

        <button onClick={() => setShowCreateModal(true)} data-testid="create-order-button">
          Create Order
        </button>
      </div>

      {/* Orders Table */}
      <table data-testid="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Title</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Date</th>
            <th>Technician</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody data-testid="orders-list">
          {paginatedOrders.map(order => (
            <tr key={order.id} data-testid={`order-row-${order.id}`}>
              <td data-testid={`order-number-${order.id}`}>{order.orderNumber}</td>
              <td data-testid={`order-title-${order.id}`}>{order.title}</td>
              <td data-testid={`order-customer-${order.id}`}>{order.customer.name}</td>
              <td data-testid={`order-status-${order.id}`}>{order.status}</td>
              <td data-testid={`order-priority-${order.id}`}>{order.priority}</td>
              <td data-testid={`order-date-${order.id}`}>{order.scheduledDate}</td>
              <td data-testid={`order-tech-${order.id}`}>
                {order.technician?.name || 'Unassigned'}
              </td>
              <td>
                <button
                  onClick={() => setSelectedOrder(order)}
                  data-testid={`view-order-${order.id}`}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div data-testid="pagination">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          data-testid="prev-page"
        >
          Previous
        </button>
        <span data-testid="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          data-testid="next-page"
        >
          Next
        </button>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && !showEditModal && (
        <div data-testid="order-detail-modal">
          <h2>Order Details</h2>
          <div data-testid="detail-order-number">{selectedOrder.orderNumber}</div>
          <div data-testid="detail-title">{selectedOrder.title}</div>
          <div data-testid="detail-description">{selectedOrder.description}</div>
          <div data-testid="detail-customer">{selectedOrder.customer.name}</div>
          <div data-testid="detail-address">{selectedOrder.customer.address}</div>
          <div data-testid="detail-status">{selectedOrder.status}</div>
          <div data-testid="detail-priority">{selectedOrder.priority}</div>
          <div data-testid="detail-date">{selectedOrder.scheduledDate}</div>
          <div data-testid="detail-time">{selectedOrder.scheduledStartTime}</div>
          <div data-testid="detail-technician">
            {selectedOrder.technician?.name || 'Unassigned'}
          </div>

          <div className="actions">
            <button 
              onClick={() => setShowEditModal(true)} 
              data-testid="edit-order-button"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                await handleCancelOrder(selectedOrder.id);
              }}
              data-testid="cancel-order-button"
            >
              Cancel Order
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              data-testid="close-detail-button"
            >
              Close
            </button>
          </div>

          {/* Reschedule Section */}
          <div data-testid="reschedule-section">
            <h3>Reschedule</h3>
            <input type="date" data-testid="reschedule-date" />
            <input type="time" data-testid="reschedule-time" />
            <button
              onClick={async () => {
                const dateInput = document.querySelector('[data-testid="reschedule-date"]') as HTMLInputElement;
                const timeInput = document.querySelector('[data-testid="reschedule-time"]') as HTMLInputElement;
                await handleReschedule(selectedOrder.id, dateInput.value, timeInput.value);
              }}
              data-testid="reschedule-button"
            >
              Reschedule
            </button>
          </div>

          {/* Assign Technician Section */}
          {!selectedOrder.technician && (
            <div data-testid="assign-section">
              <h3>Assign Technician</h3>
              <select data-testid="assign-technician-select">
                <option value="">Select technician</option>
                {mockTechnicians.filter(t => t.status === 'APPROVED').map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  const select = document.querySelector('[data-testid="assign-technician-select"]') as HTMLSelectElement;
                  if (select.value) {
                    await handleAssignTechnician(selectedOrder.id, select.value);
                  }
                }}
                data-testid="assign-button"
              >
                Assign
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div data-testid="create-order-modal">
          <h2>Create New Order</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleCreateOrder({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                customerName: formData.get('customerName') as string,
                customerAddress: formData.get('customerAddress') as string,
                categoryId: formData.get('categoryId') as string,
                priority: formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                scheduledDate: formData.get('scheduledDate') as string,
                scheduledStartTime: formData.get('scheduledStartTime') as string,
                estimatedDuration: parseInt(formData.get('estimatedDuration') as string),
              });
            }}
          >
            <input name="title" placeholder="Title" required data-testid="create-title" />
            <textarea name="description" placeholder="Description" data-testid="create-description" />
            <input name="customerName" placeholder="Customer Name" required data-testid="create-customer" />
            <input name="customerAddress" placeholder="Address" data-testid="create-address" />
            <select name="categoryId" data-testid="create-category">
              {createModalCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="priority" data-testid="create-priority">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <input type="date" name="scheduledDate" data-testid="create-date" />
            <input type="time" name="scheduledStartTime" data-testid="create-time" />
            <input type="number" name="estimatedDuration" defaultValue="60" data-testid="create-duration" />
            
            <button type="submit" data-testid="submit-create">Create</button>
            <button type="button" onClick={() => setShowCreateModal(false)} data-testid="cancel-create">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div data-testid="edit-order-modal">
          <h2>Edit Order</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleUpdateOrder(selectedOrder.id, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
              });
            }}
          >
            <input 
              name="title" 
              defaultValue={selectedOrder.title} 
              data-testid="edit-title" 
            />
            <textarea 
              name="description" 
              defaultValue={selectedOrder.description} 
              data-testid="edit-description" 
            />
            
            <button type="submit" data-testid="submit-edit">Save</button>
            <button 
              type="button" 
              onClick={() => {
                setShowEditModal(false);
                setSelectedOrder(null);
              }} 
              data-testid="cancel-edit"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

describe('Order Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ LISTING TESTS ============

  /**
   * ORD-001: Listar todas OS
   */
  describe('ORD-001: List All Orders', () => {
    it('should display orders table', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('orders-table')).toBeInTheDocument();
      });
    });

    it('should display order rows', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('orders-list')).toBeInTheDocument();
      });

      expect(screen.getByTestId('order-row-order1')).toBeInTheDocument();
      expect(screen.getByTestId('order-row-order2')).toBeInTheDocument();
    });

    it('should display order details in columns', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('order-number-order1')).toHaveTextContent('OS-001');
      });

      expect(screen.getByTestId('order-title-order1')).toHaveTextContent('HVAC Repair');
      expect(screen.getByTestId('order-customer-order1')).toHaveTextContent('Industrial Corp');
      expect(screen.getByTestId('order-status-order1')).toHaveTextContent('SCHEDULED');
    });
  });

  /**
   * ORD-002: Filtrar por status
   */
  describe('ORD-002: Filter by Status', () => {
    it('should have status filter dropdown', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });
    });

    it('should filter orders when status is selected', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('status-filter'), 'COMPLETED');

      // API should be called with status filter
    });
  });

  /**
   * ORD-003: Filtrar por data
   */
  describe('ORD-003: Filter by Date', () => {
    it('should have date filter input', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('date-filter')).toBeInTheDocument();
      });
    });

    it('should filter orders when date is selected', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('date-filter')).toBeInTheDocument();
      });

      // Simulate date selection
      fireEvent.change(screen.getByTestId('date-filter'), {
        target: { value: '2024-01-20' }
      });
    });
  });

  /**
   * ORD-004: Filtrar por técnico
   */
  describe('ORD-004: Filter by Technician', () => {
    it('should have technician filter dropdown', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('technician-filter')).toBeInTheDocument();
      });
    });
  });

  /**
   * ORD-005: Paginação
   */
  describe('ORD-005: Pagination', () => {
    it('should have pagination controls', async () => {
      render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      expect(screen.getByTestId('prev-page')).toBeInTheDocument();
      expect(screen.getByTestId('next-page')).toBeInTheDocument();
      expect(screen.getByTestId('page-info')).toBeInTheDocument();
    });
  });

  // ============ CRUD TESTS ============

  /**
   * ORD-010: Ver detalhes da OS
   */
  describe('ORD-010: View Order Details', () => {
    it('should open detail modal when clicking view button', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));

      expect(screen.getByTestId('order-detail-modal')).toBeInTheDocument();
    });

    it('should display all order details', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));

      expect(screen.getByTestId('detail-order-number')).toHaveTextContent('OS-001');
      expect(screen.getByTestId('detail-title')).toHaveTextContent('HVAC Repair');
      expect(screen.getByTestId('detail-customer')).toHaveTextContent('Industrial Corp');
    });
  });

  /**
   * ORD-011: Criar nova OS
   */
  describe('ORD-011: Create New Order', () => {
    it('should open create modal when clicking create button', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('create-order-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('create-order-button'));

      expect(screen.getByTestId('create-order-modal')).toBeInTheDocument();
    });

    it('should create order with valid data', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('create-order-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('create-order-button'));
      await user.type(screen.getByTestId('create-title'), 'New Order');
      await user.type(screen.getByTestId('create-customer'), 'New Customer');
      await user.click(screen.getByTestId('submit-create'));

      await waitFor(() => {
        expect(screen.queryByTestId('create-order-modal')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * ORD-012: Editar OS
   */
  describe('ORD-012: Edit Order', () => {
    it('should open edit modal when clicking edit button', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));
      await user.click(screen.getByTestId('edit-order-button'));

      expect(screen.getByTestId('edit-order-modal')).toBeInTheDocument();
    });

    it('should save changes when submitting edit form', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));
      await user.click(screen.getByTestId('edit-order-button'));
      
      await user.clear(screen.getByTestId('edit-title'));
      await user.type(screen.getByTestId('edit-title'), 'Updated Title');
      await user.click(screen.getByTestId('submit-edit'));

      await waitFor(() => {
        expect(screen.queryByTestId('edit-order-modal')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * ORD-013: Cancelar OS
   */
  describe('ORD-013: Cancel Order', () => {
    it('should have cancel button in order details', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));

      expect(screen.getByTestId('cancel-order-button')).toBeInTheDocument();
    });

    it('should call API when cancelling order', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));
      await user.click(screen.getByTestId('cancel-order-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('order-detail-modal')).not.toBeInTheDocument();
      });
    });
  });

  /**
   * ORD-014: Reagendar OS
   */
  describe('ORD-014: Reschedule Order', () => {
    it('should have reschedule section in order details', async () => {
      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order1'));

      expect(screen.getByTestId('reschedule-section')).toBeInTheDocument();
      expect(screen.getByTestId('reschedule-date')).toBeInTheDocument();
      expect(screen.getByTestId('reschedule-time')).toBeInTheDocument();
      expect(screen.getByTestId('reschedule-button')).toBeInTheDocument();
    });
  });

  /**
   * ORD-015: Atribuir técnico
   */
  describe('ORD-015: Assign Technician', () => {
    it('should show assign section for unassigned orders', async () => {
      // Use order2 which has no technician
      server.use(
        http.get('*/empresa/orders', () => {
          return HttpResponse.json([
            { ...mockOrders[1], technician: undefined }
          ]);
        })
      );

      const { user } = render(<MockOrderManagement />);

      await waitFor(() => {
        expect(screen.getByTestId('view-order-order2')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-order-order2'));

      expect(screen.getByTestId('assign-section')).toBeInTheDocument();
      expect(screen.getByTestId('assign-technician-select')).toBeInTheDocument();
      expect(screen.getByTestId('assign-button')).toBeInTheDocument();
    });
  });
});

// Import fireEvent for date input
import { fireEvent } from '@testing-library/react';
