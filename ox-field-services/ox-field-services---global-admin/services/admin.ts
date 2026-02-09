import client from './client';

// Types
export interface DashboardMetrics {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalRevenue: number;
    revenueChange: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
    apiLatency: number;
    errorRate: number;
}

export interface Tenant {
    id: string;
    name: string;
    domain: string;
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'pending' | 'trial';
    createdAt: string;
    userCount: number;
    technicianCount: number;
    jobCount: number;
    mrr: number;
    region: string;
    features: string[];
}

export interface TenantDetails extends Tenant {
    contactEmail: string;
    contactPhone: string;
    billingAddress: string;
    subscriptionStartDate: string;
    subscriptionEndDate?: string;
    lastActivityAt: string;
    settings: Record<string, any>;
}

export interface TenantMetrics {
    dailyActiveUsers: number;
    jobsCreated: number;
    jobsCompleted: number;
    averageJobDuration: number;
    customerSatisfaction: number;
    revenueGenerated: number;
}

export interface CreateTenantRequest {
    name: string;
    domain: string;
    plan: string;
    adminEmail: string;
    adminName: string;
    region: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    actorId: string;
    actorName: string;
    actorEmail: string;
    tenantId?: string;
    tenantName?: string;
    resourceType: string;
    resourceId: string;
    details: string;
    ipAddress: string;
}

export interface TechnicianWithTenant {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    skills: string[];
    rating: number;
    isOnline: boolean;
    avatarUrl?: string;
    createdAt: string;
    tenantName?: string;
    tenantDomain?: string;
}

export interface TechnicianDocument {
    id: string;
    type: string;
    fileName: string;
    url: string;
    status: string;
    uploadedAt: string;
}

// API Services
export const adminService = {
    // Dashboard
    getDashboard: async (): Promise<DashboardMetrics> => {
        const response = await client.get<DashboardMetrics>('/admin/global/dashboard');
        return response.data;
    },

    // Tenants
    getTenants: async (params?: { 
        status?: string; 
        plan?: string; 
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ tenants: Tenant[]; total: number }> => {
        const response = await client.get<{ tenants: Tenant[]; total: number }>('/admin/global/tenants', { params });
        return response.data;
    },

    getTenant: async (id: string): Promise<TenantDetails> => {
        const response = await client.get<TenantDetails>(`/admin/global/tenants/${id}`);
        return response.data;
    },

    createTenant: async (data: CreateTenantRequest): Promise<Tenant> => {
        const response = await client.post<Tenant>('/admin/global/tenants', data);
        return response.data;
    },

    updateTenantStatus: async (id: string, status: 'active' | 'suspended'): Promise<Tenant> => {
        const response = await client.patch<Tenant>(`/admin/global/tenants/${id}/status`, { status });
        return response.data;
    },

    impersonateTenant: async (id: string): Promise<{ token: string; redirectUrl: string }> => {
        const response = await client.post<{ token: string; redirectUrl: string }>(`/admin/global/tenants/${id}/impersonate`);
        return response.data;
    },

    getTenantMetrics: async (id: string, period?: '7d' | '30d' | '90d'): Promise<TenantMetrics> => {
        const response = await client.get<TenantMetrics>(`/admin/global/tenants/${id}/metrics`, { 
            params: { period } 
        });
        return response.data;
    },

    getTenantTechnicians: async (tenantId: string): Promise<TechnicianWithTenant[]> => {
        const response = await client.get<TechnicianWithTenant[]>(`/admin/global/tenants/${tenantId}/technicians`);
        return response.data;
    },

    // Logs
    getLogs: async (params?: {
        tenantId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{ logs: AuditLog[]; total: number }> => {
        const response = await client.get<{ logs: AuditLog[]; total: number }>('/admin/global/logs', { params });
        return response.data;
    },

    // System
    getSystemHealth: async (): Promise<{
        status: string;
        services: { name: string; status: string; latency: number }[];
        lastChecked: string;
    }> => {
        const response = await client.get('/admin/global/system/health');
        return response.data;
    },

    // Technician Approvals
    getPendingTechnicians: async (): Promise<TechnicianWithTenant[]> => {
        const response = await client.get<TechnicianWithTenant[]>('/admin/global/technicians/pending');
        return response.data;
    },

    getTechnicianDetails: async (id: string): Promise<TechnicianWithTenant> => {
        const response = await client.get<TechnicianWithTenant>(`/admin/global/technicians/${id}`);
        return response.data;
    },

    getTechnicianDocuments: async (id: string): Promise<TechnicianDocument[]> => {
        const response = await client.get<TechnicianDocument[]>(`/admin/global/technicians/${id}/documents`);
        return response.data;
    },

    updateTechnicianStatus: async (
        id: string,
        status: 'APPROVED' | 'REJECTED',
        notes?: string
    ): Promise<TechnicianWithTenant> => {
        const response = await client.patch<TechnicianWithTenant>(`/admin/global/technicians/${id}/status`, {
            status,
            notes
        });
        return response.data;
    }
};
