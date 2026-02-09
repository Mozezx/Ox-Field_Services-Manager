import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup();
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
  };

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Test data factories
export const createMockDashboardData = (overrides = {}) => ({
  totalJobs: 1284,
  totalJobsChange: 12,
  revenue: 48200,
  revenueChange: 8,
  avgResponseTime: 42,
  avgResponseTimeChange: -2,
  activeTechnicians: 24,
  totalTechnicians: 30,
  utilizationRate: 80,
  ...overrides,
});

export const createMockTechnician = (overrides = {}) => ({
  id: '1',
  userId: 'u1',
  name: 'Test Technician',
  email: 'test@example.com',
  phone: '555-1234',
  role: 'Technician',
  status: 'PENDING' as const,
  skills: ['HVAC'],
  rating: 4.5,
  isOnline: false,
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2023-10-24',
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 'order1',
  orderNumber: 'OS-001',
  title: 'Test Order',
  description: 'Test description',
  customer: {
    id: 'c1',
    name: 'Test Customer',
    address: '123 Test St',
  },
  status: 'SCHEDULED' as const,
  priority: 'MEDIUM' as const,
  scheduledDate: '2024-01-20',
  scheduledStartTime: '09:00',
  estimatedDuration: 60,
  category: { id: 'cat-general', name: 'General', code: 'general' },
  ...overrides,
});

export const createMockSubscription = (overrides = {}) => ({
  id: 'sub1',
  planEdition: 'PROFESSIONAL' as const,
  status: 'ACTIVE',
  monthlyBaseAmount: 299,
  totalAmount: 845,
  userCounts: {
    ADMIN: 2,
    GESTOR: 3,
    TECNICO: 8,
  },
  periodStart: '2024-01-01',
  periodEnd: '2024-01-31',
  ...overrides,
});

export const createMockInvoice = (overrides = {}) => ({
  id: 'inv1',
  invoiceNumber: 'INV-2024-001',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-31',
  subtotal: 845,
  taxAmount: 177.45,
  totalAmount: 1022.45,
  status: 'PAID' as const,
  dueDate: '2024-02-05',
  paidAt: '2024-02-03',
  lines: [
    { description: 'Test Item', quantity: 1, unitPrice: 100, total: 100 },
  ],
  ...overrides,
});

// Wait utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 100));

// Assertion helpers
export const expectLoadingIndicator = (container: HTMLElement) => {
  const spinners = container.querySelectorAll('.animate-spin');
  expect(spinners.length).toBeGreaterThan(0);
};
