import { http, HttpResponse } from 'msw';

// Mock data
export const mockDashboardData = {
  totalJobs: 1284,
  totalJobsChange: 12,
  revenue: 48200,
  revenueChange: 8,
  avgResponseTime: 42,
  avgResponseTimeChange: -2,
  activeTechnicians: 24,
  totalTechnicians: 30,
  utilizationRate: 80,
};

export const mockOrdersByStatus = {
  scheduled: 45,
  inProgress: 12,
  completed: 156,
  cancelled: 8,
};

export const mockWeeklyJobs = [
  { name: 'Mon', jobs: 12 },
  { name: 'Tue', jobs: 19 },
  { name: 'Wed', jobs: 15 },
  { name: 'Thu', jobs: 22 },
  { name: 'Fri', jobs: 30 },
  { name: 'Sat', jobs: 25 },
  { name: 'Sun', jobs: 18 },
];

export const mockTechnicians = [
  {
    id: '1',
    userId: 'u1',
    name: 'David Miller',
    email: 'david@example.com',
    phone: '555-1234',
    role: 'Electrician',
    status: 'PENDING',
    skills: ['HVAC', 'Wiring'],
    rating: 4.5,
    isOnline: false,
    avatarUrl: 'https://picsum.photos/seed/david/60/60',
    createdAt: '2023-10-24',
  },
  {
    id: '2',
    userId: 'u2',
    name: 'Elena Rodriguez',
    email: 'elena@example.com',
    phone: '555-5678',
    role: 'Plumber',
    status: 'APPROVED',
    skills: ['Pipefitting'],
    rating: 4.8,
    isOnline: true,
    avatarUrl: 'https://picsum.photos/seed/elena/60/60',
    createdAt: '2023-10-23',
  },
  {
    id: '3',
    userId: 'u3',
    name: 'Sam Bridges',
    email: 'sam@bridges.com',
    phone: '555-9999',
    role: 'Courier',
    status: 'REJECTED',
    skills: ['Driving'],
    rating: 3.2,
    isOnline: false,
    avatarUrl: 'https://picsum.photos/seed/sam/60/60',
    createdAt: '2023-10-20',
  },
];

export const mockTechnicianDocuments = [
  {
    id: 'doc1',
    type: 'ID Card',
    fileName: 'id_card.pdf',
    url: 'https://example.com/docs/id_card.pdf',
    status: 'PENDING',
    uploadedAt: '2023-10-24',
  },
  {
    id: 'doc2',
    type: 'Certificate',
    fileName: 'hvac_cert.pdf',
    url: 'https://example.com/docs/hvac_cert.pdf',
    status: 'APPROVED',
    uploadedAt: '2023-10-24',
  },
];

export const mockOrders = [
  {
    id: 'order1',
    orderNumber: 'OS-001',
    title: 'HVAC Repair',
    description: 'Fix broken AC unit',
    customer: {
      id: 'c1',
      name: 'Industrial Corp',
      address: '124 Industrial Ave',
    },
    technician: {
      id: '2',
      name: 'Elena Rodriguez',
      avatarUrl: 'https://picsum.photos/seed/elena/60/60',
    },
    status: 'SCHEDULED',
    priority: 'HIGH',
    scheduledDate: '2024-01-20',
    scheduledStartTime: '09:00',
    estimatedDuration: 120,
    category: 'HVAC',
  },
  {
    id: 'order2',
    orderNumber: 'OS-002',
    title: 'Electrical Inspection',
    description: 'Annual inspection',
    customer: {
      id: 'c2',
      name: 'Office Building A',
      address: '456 Business St',
    },
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    scheduledDate: '2024-01-20',
    scheduledStartTime: '14:00',
    estimatedDuration: 60,
    category: 'Electrical',
  },
];

export const mockCalendarEntries = [
  {
    technicianId: '2',
    technicianName: 'Elena Rodriguez',
    technicianAvatar: 'https://picsum.photos/seed/elena/60/60',
    skills: ['HVAC', 'Plumbing'],
    isOnline: true,
    orders: [mockOrders[0]],
  },
  {
    technicianId: '1',
    technicianName: 'David Miller',
    technicianAvatar: 'https://picsum.photos/seed/david/60/60',
    skills: ['Electrical'],
    isOnline: false,
    orders: [],
  },
];

export const mockSubscription = {
  id: 'sub1',
  planEdition: 'PROFESSIONAL',
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
};

export const mockInvoices = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2024-001',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    subtotal: 845,
    taxAmount: 177.45,
    totalAmount: 1022.45,
    status: 'PAID',
    dueDate: '2024-02-05',
    paidAt: '2024-02-03',
    lines: [
      { description: 'Plano Professional', quantity: 1, unitPrice: 299, total: 299 },
      { description: 'Admins (2x R$49)', quantity: 2, unitPrice: 49, total: 98 },
      { description: 'Gestores (3x R$79)', quantity: 3, unitPrice: 79, total: 237 },
      { description: 'Técnicos (8x R$39)', quantity: 8, unitPrice: 39, total: 312 },
    ],
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2024-002',
    periodStart: '2024-02-01',
    periodEnd: '2024-02-29',
    subtotal: 845,
    taxAmount: 177.45,
    totalAmount: 1022.45,
    status: 'PENDING',
    dueDate: '2024-03-05',
    lines: [
      { description: 'Plano Professional', quantity: 1, unitPrice: 299, total: 299 },
      { description: 'Admins (2x R$49)', quantity: 2, unitPrice: 49, total: 98 },
      { description: 'Gestores (3x R$79)', quantity: 3, unitPrice: 79, total: 237 },
      { description: 'Técnicos (8x R$39)', quantity: 8, unitPrice: 39, total: 312 },
    ],
  },
];

export const mockCredits = {
  totalAvailable: 1250,
  balances: [
    {
      id: 'bal1',
      purchased: 2000,
      used: 750,
      remaining: 1250,
      amountPaid: 699,
      purchasedAt: '2024-01-15',
      expiresAt: '2025-01-15',
    },
  ],
};

export const mockUsage = {
  tenantId: 'tenant1',
  month: '2024-01',
  userCounts: {
    ADMIN: 2,
    GESTOR: 3,
    TECNICO: 8,
  },
  ordersCreated: 156,
  ordersCompleted: 142,
  totalCreditsUsed: 312,
  creditUsageByType: {
    ORDER_CREATED: 156,
    ROUTE_OPTIMIZATION: 78,
    SMS_SENT: 78,
  },
};

// API Handlers
export const handlers = [
  // Dashboard endpoints
  http.get('*/empresa/dashboard', () => {
    return HttpResponse.json(mockDashboardData);
  }),

  http.get('*/empresa/dashboard/orders-by-status', () => {
    return HttpResponse.json(mockOrdersByStatus);
  }),

  http.get('*/empresa/dashboard/weekly-jobs', () => {
    return HttpResponse.json(mockWeeklyJobs);
  }),

  // Technicians endpoints
  http.get('*/empresa/technicians', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    if (status) {
      return HttpResponse.json(mockTechnicians.filter(t => t.status === status));
    }
    return HttpResponse.json(mockTechnicians);
  }),

  http.get('*/empresa/technicians/:id', ({ params }) => {
    const tech = mockTechnicians.find(t => t.id === params.id);
    if (tech) {
      return HttpResponse.json(tech);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/empresa/technicians/:id/documents', () => {
    return HttpResponse.json(mockTechnicianDocuments);
  }),

  http.get('*/empresa/categories', () => {
    return HttpResponse.json(mockCategories);
  }),

  http.patch('*/empresa/technicians/:id/status', async ({ params, request }) => {
    const body = await request.json() as { status: string; notes?: string };
    const tech = mockTechnicians.find(t => t.id === params.id);
    if (tech) {
      return HttpResponse.json({ ...tech, status: body.status });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.patch('*/empresa/technicians/:techId/documents/:docId/review', async ({ params, request }) => {
    const body = await request.json() as { status: string; notes?: string };
    const doc = mockTechnicianDocuments.find(d => d.id === params.docId);
    if (doc) {
      return HttpResponse.json({ ...doc, status: body.status, reviewNotes: body.notes });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Dispatch endpoints
  http.get('*/empresa/dispatch/calendar', () => {
    return HttpResponse.json(mockCalendarEntries);
  }),

  http.get('*/empresa/dispatch/unassigned', () => {
    return HttpResponse.json(mockOrders.filter(o => !o.technician));
  }),

  http.post('*/empresa/dispatch/suggest', () => {
    return HttpResponse.json([
      { technicianId: '2', technicianName: 'Elena Rodriguez', score: 0.95, reason: 'Best skill match', estimatedArrival: 15 },
      { technicianId: '1', technicianName: 'David Miller', score: 0.80, reason: 'Closest proximity', estimatedArrival: 25 },
    ]);
  }),

  // Orders endpoints
  http.get('*/empresa/orders', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    if (status) {
      return HttpResponse.json(mockOrders.filter(o => o.status === status));
    }
    return HttpResponse.json(mockOrders);
  }),

  http.get('*/empresa/orders/:id', ({ params }) => {
    const order = mockOrders.find(o => o.id === params.id);
    if (order) {
      return HttpResponse.json(order);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post('*/empresa/orders', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const categoryId = body.categoryId as string | undefined;
    const category = categoryId
      ? mockCategories.find(c => c.id === categoryId) ?? mockCategories[0]
      : mockCategories[0];
    const newOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `OS-${Date.now()}`,
      status: 'SCHEDULED',
      ...body,
      category: { id: category.id, name: category.name, code: category.code },
    };
    return HttpResponse.json(newOrder, { status: 201 });
  }),

  http.patch('*/empresa/orders/:id/assign', async ({ params, request }) => {
    const body = await request.json() as { technicianId: string };
    const order = mockOrders.find(o => o.id === params.id);
    if (order) {
      return HttpResponse.json({
        ...order,
        technician: mockTechnicians.find(t => t.id === body.technicianId),
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.patch('*/empresa/orders/:id/reschedule', async ({ params, request }) => {
    const body = await request.json() as { scheduledDate: string; scheduledStartTime: string };
    const order = mockOrders.find(o => o.id === params.id);
    if (order) {
      return HttpResponse.json({
        ...order,
        scheduledDate: body.scheduledDate,
        scheduledStartTime: body.scheduledStartTime,
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.put('*/empresa/orders/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const order = mockOrders.find(o => o.id === params.id);
    if (order) {
      return HttpResponse.json({ ...order, ...body });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('*/empresa/orders/:id', ({ params }) => {
    const order = mockOrders.find(o => o.id === params.id);
    if (order) {
      return HttpResponse.json({ ...order, status: 'CANCELLED' });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Billing endpoints
  http.get('*/empresa/billing/subscription', () => {
    return HttpResponse.json(mockSubscription);
  }),

  http.get('*/empresa/billing/invoices', () => {
    return HttpResponse.json(mockInvoices);
  }),

  http.get('*/empresa/billing/credits', () => {
    return HttpResponse.json(mockCredits);
  }),

  http.get('*/empresa/billing/usage', () => {
    return HttpResponse.json(mockUsage);
  }),
];
