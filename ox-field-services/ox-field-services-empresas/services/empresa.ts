import client from './client';

// Types
export interface DashboardData {
    totalJobs: number;
    totalJobsChange: number;
    revenue: number;
    revenueChange: number;
    avgResponseTime: number;
    avgResponseTimeChange: number;
    activeTechnicians: number;
    totalTechnicians: number;
    utilizationRate: number;
}

export interface OrdersByStatus {
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
}

export interface WeeklyJobData {
    name: string;
    jobs: number;
}

export interface Technician {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    skills: string[];
    rating: number;
    isOnline: boolean;
    avatarUrl?: string;
    vehicleModel?: string;
    vehiclePlate?: string;
    createdAt: string;
}

export interface TechnicianDocument {
    id: string;
    type: string;
    fileName: string;
    url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    uploadedAt: string;
    reviewedAt?: string;
    reviewNotes?: string;
}

export interface ServiceCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    defaultDurationMinutes?: number;
    priceMultiplier?: number;
}

/** Client list item returned by GET /empresa/clients */
export interface ClientListItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    primaryAddress?: string;
}

export interface ServiceOrder {
    id: string;
    orderNumber: string;
    title: string;
    description?: string;
    customer: {
        id: string;
        name: string;
        address: string;
    };
    technician?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    /** Backend returns lowercase e.g. "scheduled", "in_progress", "completed", "cancelled" */
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    scheduledDate: string;
    scheduledStartTime: string;
    estimatedDuration: number; // in minutes
    actualStartTime?: string;
    actualEndTime?: string;
    category: { id: string; name: string; code: string } | string; // backend returns object; legacy may be string
    /** Token to share order link with client (present right after creation). */
    shareToken?: string | null;
}

export interface CalendarEntry {
    technicianId: string;
    technicianName: string;
    technicianAvatar?: string;
    skills: string[];
    isOnline: boolean;
    orders: ServiceOrder[];
}

export interface DispatchSuggestion {
    technicianId: string;
    technicianName: string;
    score: number;
    reason: string;
    estimatedArrival: number; // in minutes
}

export interface FleetLocationEntry {
    technicianId: string;
    name: string;
    latitude: number;
    longitude: number;
}

export interface ServiceListingResponse {
    id: string;
    tenantId: string;
    categoryId: string;
    categoryName: string;
    categoryCode: string;
    title: string;
    description?: string;
    priceFrom?: number;
    imageUrl?: string;
    active: boolean;
}

// API Services
export const empresaService = {
    // Dashboard
    getDashboard: async (): Promise<DashboardData> => {
        const response = await client.get<DashboardData>('/empresa/dashboard');
        return response.data;
    },

    getOrdersByStatus: async (): Promise<OrdersByStatus> => {
        const response = await client.get<OrdersByStatus>('/empresa/dashboard/orders-by-status');
        return response.data;
    },

    getWeeklyJobs: async (): Promise<WeeklyJobData[]> => {
        const response = await client.get<WeeklyJobData[]>('/empresa/dashboard/weekly-jobs');
        return response.data;
    },

    // Tenant (for other uses)
    getTenant: async (): Promise<{ id: string; name: string; domain: string }> => {
        const response = await client.get<{ id: string; name: string; domain: string }>('/empresa/tenant');
        return response.data;
    },

    // Invite link (one per technician)
    createInvite: async (): Promise<{ token: string; inviteLink: string }> => {
        const response = await client.post<{ token: string; inviteLink: string }>('/empresa/invites');
        return response.data;
    },

    // Client invite link (for clients to join the company)
    createClientInvite: async (): Promise<{ inviteId: string; token: string; inviteLink: string }> => {
        const response = await client.post<{ inviteId: string; token: string; inviteLink: string }>('/empresa/client-invites');
        return response.data;
    },

    // Clients (list all clients of the company)
    getClients: async (): Promise<ClientListItem[]> => {
        const response = await client.get<ClientListItem[]>('/empresa/clients');
        return response.data;
    },

    // Technicians (Approvals)
    getTechnicians: async (status?: string): Promise<Technician[]> => {
        const params = status ? { status } : {};
        const response = await client.get<Technician[]>('/empresa/technicians', { params });
        return response.data;
    },

    getTechnician: async (id: string): Promise<Technician> => {
        const response = await client.get<Technician>(`/empresa/technicians/${id}`);
        return response.data;
    },

    updateTechnicianStatus: async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<Technician> => {
        const response = await client.patch<Technician>(`/empresa/technicians/${id}/status`, {
            status,
            notes
        });
        return response.data;
    },

    getTechnicianDocuments: async (id: string): Promise<TechnicianDocument[]> => {
        const response = await client.get<TechnicianDocument[]>(`/empresa/technicians/${id}/documents`);
        return response.data;
    },

    // Categories (service categories by tenant)
    getCategories: async (): Promise<ServiceCategory[]> => {
        const response = await client.get<ServiceCategory[]>('/empresa/categories');
        return response.data;
    },

    createCategory: async (data: {
        name: string;
        code: string;
        description?: string;
        defaultDurationMinutes?: number;
        priceMultiplier?: number;
    }): Promise<ServiceCategory> => {
        const response = await client.post<ServiceCategory>('/empresa/categories', data);
        return response.data;
    },

    updateCategory: async (id: string, data: {
        name?: string;
        code?: string;
        description?: string;
        defaultDurationMinutes?: number;
        priceMultiplier?: number;
    }): Promise<ServiceCategory> => {
        const response = await client.put<ServiceCategory>(`/empresa/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
        await client.delete(`/empresa/categories/${id}`);
    },

    // Listings (marketplace)
    getListings: async (): Promise<ServiceListingResponse[]> => {
        const response = await client.get<ServiceListingResponse[]>('/empresa/listings');
        return response.data;
    },

    getListing: async (id: string): Promise<ServiceListingResponse> => {
        const response = await client.get<ServiceListingResponse>(`/empresa/listings/${id}`);
        return response.data;
    },

    createListing: async (data: {
        categoryId: string;
        title: string;
        description?: string;
        priceFrom?: number;
        imageUrl?: string;
        active?: boolean;
    }): Promise<ServiceListingResponse> => {
        const response = await client.post<ServiceListingResponse>('/empresa/listings', data);
        return response.data;
    },

    updateListing: async (id: string, data: {
        categoryId?: string;
        title?: string;
        description?: string;
        priceFrom?: number;
        imageUrl?: string;
        active?: boolean;
    }): Promise<ServiceListingResponse> => {
        const response = await client.put<ServiceListingResponse>(`/empresa/listings/${id}`, data);
        return response.data;
    },

    deleteListing: async (id: string): Promise<void> => {
        await client.delete(`/empresa/listings/${id}`);
    },

    reviewDocument: async (techId: string, docId: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<TechnicianDocument> => {
        const response = await client.patch<TechnicianDocument>(
            `/empresa/technicians/${techId}/documents/${docId}/review`,
            { status, notes }
        );
        return response.data;
    },

    // Dispatch
    getCalendar: async (date?: string): Promise<CalendarEntry[]> => {
        const params = date ? { date } : {};
        const response = await client.get<CalendarEntry[]>('/empresa/dispatch/calendar', { params });
        return response.data;
    },

    getUnassignedOrders: async (): Promise<ServiceOrder[]> => {
        const response = await client.get<ServiceOrder[]>('/empresa/dispatch/unassigned');
        return response.data;
    },

    suggestTechnician: async (orderId: string): Promise<DispatchSuggestion[]> => {
        const response = await client.post<DispatchSuggestion[]>('/empresa/dispatch/suggest', { orderId });
        return response.data;
    },

    getFleetLocations: async (): Promise<FleetLocationEntry[]> => {
        const response = await client.get<FleetLocationEntry[]>('/empresa/fleet/locations');
        return response.data;
    },

    // Orders
    getOrders: async (params?: { status?: string; date?: string; technicianId?: string }): Promise<ServiceOrder[]> => {
        const response = await client.get<ServiceOrder[]>('/empresa/orders', { params });
        return response.data;
    },

    getOrder: async (id: string): Promise<ServiceOrder> => {
        const response = await client.get<ServiceOrder>(`/empresa/orders/${id}`);
        return response.data;
    },

    createOrder: async (order: Partial<ServiceOrder> & { categoryId?: string; customerId?: string }): Promise<ServiceOrder> => {
        const payload: Record<string, unknown> = { ...order };
        if ('categoryId' in order && order.categoryId) {
            payload.categoryId = order.categoryId;
        }
        // Always send customerId when it is a non-empty string so the backend uses the selected client (avoids fallback to first customer)
        const customerId = typeof order.customerId === 'string' ? order.customerId.trim() : '';
        if (customerId) {
            payload.customerId = customerId;
        }
        const response = await client.post<ServiceOrder>('/empresa/orders', payload, { timeout: 20000 });
        return response.data;
    },

    assignTechnician: async (orderId: string, technicianId: string): Promise<ServiceOrder> => {
        const response = await client.patch<ServiceOrder>(`/empresa/orders/${orderId}/assign`, {
            technicianId
        });
        return response.data;
    },

    /**
     * Assign technician and schedule in one step (used for drag-and-drop)
     */
    assignAndSchedule: async (
        orderId: string, 
        technicianId: string, 
        date: string, 
        startTime: string
    ): Promise<ServiceOrder> => {
        const response = await client.patch<ServiceOrder>(`/empresa/orders/${orderId}/assign`, {
            technicianId,
            date,
            startTime
        });
        return response.data;
    },

    rescheduleOrder: async (orderId: string, scheduledDate: string, scheduledStartTime: string): Promise<ServiceOrder> => {
        const response = await client.patch<ServiceOrder>(`/empresa/orders/${orderId}/reschedule`, {
            scheduledDate,
            scheduledStartTime
        });
        return response.data;
    },

    unassignOrder: async (orderId: string): Promise<ServiceOrder> => {
        const response = await client.patch<ServiceOrder>(`/empresa/orders/${orderId}/unassign`);
        return response.data;
    },

    // ========== Billing ==========
    
    getMySubscription: async (): Promise<SubscriptionInfo> => {
        const response = await client.get<SubscriptionInfo>('/empresa/billing/subscription');
        return response.data;
    },

    getMyInvoices: async (): Promise<InvoiceInfo[]> => {
        const response = await client.get<InvoiceInfo[]>('/empresa/billing/invoices');
        return response.data;
    },

    getMyUsage: async (year?: number, month?: number): Promise<UsageInfo> => {
        const params: Record<string, number> = {};
        if (year) params.year = year;
        if (month) params.month = month;
        const response = await client.get<UsageInfo>('/empresa/billing/usage', { params });
        return response.data;
    },

    getMyCredits: async (): Promise<CreditInfo> => {
        const response = await client.get<CreditInfo>('/empresa/billing/credits');
        return response.data;
    }
};

// ========== Billing Types ==========

export interface SubscriptionInfo {
    id: string;
    planEdition: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    status: string;
    monthlyBaseAmount: number;
    totalAmount: number;
    userCounts: {
        ADMIN: number;
        GESTOR: number;
        TECNICO: number;
    };
    periodStart: string;
    periodEnd: string;
}

export interface InvoiceInfo {
    id: string;
    invoiceNumber: string;
    periodStart: string;
    periodEnd: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string;
    paidAt?: string;
    lines: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
}

export interface UsageInfo {
    tenantId: string;
    month: string;
    userCounts: Record<string, number>;
    ordersCreated: number;
    ordersCompleted: number;
    totalCreditsUsed: number;
    creditUsageByType: Record<string, number>;
}

export interface CreditInfo {
    totalAvailable: number;
    balances: {
        id: string;
        purchased: number;
        used: number;
        remaining: number;
        amountPaid: number;
        purchasedAt: string;
        expiresAt?: string;
    }[];
}
