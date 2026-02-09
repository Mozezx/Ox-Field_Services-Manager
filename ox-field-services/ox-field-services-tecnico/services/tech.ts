import client from './client';

// Types
export interface AgendaItem {
    id: string;
    orderNumber: string;
    title: string;
    description?: string;
    customer: {
        id: string;
        name: string;
        phone: string;
        address: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    status: 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    scheduledDate: string;
    scheduledStartTime: string;
    estimatedDuration: number;
    actualStartTime?: string;
    actualEndTime?: string;
    category: string;
    notes?: string;
}

export interface ChecklistItem {
    id: string;
    description: string;
    required: boolean;
    completed: boolean;
    completedAt?: string;
    notes?: string;
}

export interface Material {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    cost?: number;
    notes?: string;
}

export interface OrderDetails extends AgendaItem {
    checklist: ChecklistItem[];
    materials: Material[];
    photos: string[];
    signature?: string;
    technicianNotes?: string;
}

export interface TechnicianProfile {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    skills: string[];
    rating: number;
    totalJobs: number;
    completionRate: number;
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    vehicleModel?: string;
    vehiclePlate?: string;
    currentLocation?: {
        lat: number;
        lng: number;
        updatedAt: string;
    };
}

export interface PerformanceMetrics {
    period: string;
    jobsCompleted: number;
    avgDuration: number;
    onTimeRate: number;
    customerRating: number;
    earnings: number;
}

export interface Notification {
    id: string;
    type: 'NEW_JOB' | 'RESCHEDULE' | 'CANCELLATION' | 'MESSAGE' | 'SYSTEM';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: Record<string, any>;
}

/** Returns local date as YYYY-MM-DD (technician's "today" to avoid server timezone mismatch). */
export function getLocalDateString(): string {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Add days to a YYYY-MM-DD date string and return the result as YYYY-MM-DD. */
export function addDaysToDate(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Format a YYYY-MM-DD date for agenda display (Hoje, Ontem, Amanhã, or full date). */
export function formatAgendaDateLabel(dateStr: string): string {
    const today = getLocalDateString();
    if (dateStr === today) return 'Hoje';
    const yesterday = addDaysToDate(today, -1);
    if (dateStr === yesterday) return 'Ontem';
    const tomorrow = addDaysToDate(today, 1);
    if (dateStr === tomorrow) return 'Amanhã';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
}

// API Services
export const techService = {
    // Agenda
    getAgenda: async (date?: string): Promise<AgendaItem[]> => {
        const dateParam = date ?? getLocalDateString();
        const params = { date: dateParam };
        const response = await client.get<any[]>('/tech/agenda', { params });
        // Map backend response to frontend format
        return response.data.map((order: any) => ({
            id: order.id,
            orderNumber: order.osNumber,
            title: order.title,
            customer: {
                id: order.customerId || '',
                name: order.customerName || 'Cliente',
                phone: order.customerPhone || '',
                address: order.address || '',
                coordinates: order.addressLatitude != null && order.addressLongitude != null ? {
                    lat: order.addressLatitude,
                    lng: order.addressLongitude
                } : undefined
            },
            status: mapStatus(order.status),
            priority: mapPriority(order.priority),
            scheduledDate: order.scheduledDate || new Date().toISOString().split('T')[0],
            scheduledStartTime: order.scheduledStart || '09:00',
            estimatedDuration: order.durationMinutes || 60,
            category: order.category || 'GENERAL',
            actualStartTime: order.actualStartTime || undefined,
            actualEndTime: order.actualEndTime || undefined
        }));
    },

    getAgendaByDate: async (date: string): Promise<AgendaItem[]> => {
        return techService.getAgenda(date);
    },

    getOrder: async (id: string): Promise<OrderDetails> => {
        const response = await client.get<any>(`/tech/orders/${id}`);
        const order = response.data;
        // Fetch checklist and photos separately
        const [checklist, photos] = await Promise.all([
            techService.getChecklist(id).catch(() => []),
            client.get<string[]>(`/tech/orders/${id}/photos`).then(r => r.data.map((p: any) => p.url || p.fileUrl)).catch(() => [])
        ]);
        
        return {
            id: order.id,
            orderNumber: order.osNumber,
            title: order.title,
            description: order.description,
            customer: {
                id: order.customerId || '',
                name: order.customerName || 'Cliente',
                phone: order.customerPhone || '',
                address: order.address?.street || '',
                coordinates: order.address?.latitude && order.address?.longitude ? {
                    lat: order.address.latitude,
                    lng: order.address.longitude
                } : undefined
            },
            status: mapStatus(order.status),
            priority: mapPriority(order.priority),
            scheduledDate: order.scheduledDate,
            scheduledStartTime: order.scheduledStart,
            estimatedDuration: order.durationMinutes,
            category: order.category,
            checklist: checklist,
            photos: photos,
            materials: [],
            signature: order.hasSignature ? 'signed' : undefined
        };
    },

    // Order Execution
    startRoute: async (orderId: string): Promise<AgendaItem> => {
        const response = await client.post<any>(`/tech/orders/${orderId}/start-route`);
        return mapOrderToAgendaItem(response.data);
    },

    arriveAtLocation: async (orderId: string, lat: number, lng: number): Promise<AgendaItem> => {
        const response = await client.post<any>(`/tech/orders/${orderId}/arrive`, null, {
            params: { latitude: lat, longitude: lng }
        });
        return mapOrderToAgendaItem(response.data);
    },

    startWork: async (orderId: string): Promise<AgendaItem> => {
        // Start work is handled by arriveAtLocation
        return techService.getOrder(orderId);
    },

    completeOrder: async (orderId: string, data?: {
        notes?: string;
        signature?: string;
        photos?: string[];
    }): Promise<AgendaItem> => {
        // Submit signature if provided
        if (data?.signature) {
            await techService.submitSignature(orderId, data.signature);
        }
        const response = await client.post<any>(`/tech/orders/${orderId}/complete`);
        return mapOrderToAgendaItem(response.data);
    },

    // Checklist
    getChecklist: async (orderId: string): Promise<ChecklistItem[]> => {
        const response = await client.get<{ items: any[] }>(`/tech/orders/${orderId}/checklist`);
        return response.data.items.map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            required: item.required !== false,
            completed: item.completed === true
        }));
    },

    updateChecklist: async (orderId: string, checklist: ChecklistItem[]): Promise<ChecklistItem[]> => {
        const response = await client.put<{ items: any[] }>(`/tech/orders/${orderId}/checklist`, {
            items: checklist.map(item => ({
                id: parseInt(item.id),
                description: item.description,
                completed: item.completed,
                required: item.required
            }))
        });
        return response.data.items.map((item: any) => ({
            id: item.id.toString(),
            description: item.description,
            required: item.required !== false,
            completed: item.completed === true
        }));
    },

    // Photos
    uploadPhoto: async (orderId: string, photo: File | string, caption?: string, lat?: number, lng?: number): Promise<string> => {
        const formData = new FormData();
        const params: any = {};
        
        if (typeof photo === 'string') {
            // Base64 string
            params.photoBase64 = photo;
            if (caption) params.caption = caption;
            if (lat !== undefined) params.latitude = lat;
            if (lng !== undefined) params.longitude = lng;
        } else {
            formData.append('photo', photo);
            if (caption) formData.append('caption', caption);
            if (lat !== undefined) params.latitude = lat;
            if (lng !== undefined) params.longitude = lng;
        }
        
        const response = await client.post<{ url: string; fileUrl: string }>(`/tech/orders/${orderId}/photos`, 
            typeof photo === 'string' ? params : formData, {
            headers: typeof photo === 'string' ? {} : { 'Content-Type': 'multipart/form-data' },
            params: typeof photo === 'string' ? params : (Object.keys(params).length ? params : undefined)
        });
        return response.data.url || response.data.fileUrl;
    },

    // Signature
    submitSignature: async (orderId: string, signature: string): Promise<void> => {
        await client.post(`/tech/orders/${orderId}/signature`, { signature });
    },

    // Materials
    getMaterialsCatalog: async (category?: string): Promise<any[]> => {
        const params = category ? { category } : {};
        const response = await client.get<any[]>('/tech/materials', { params });
        return response.data;
    },

    addMaterials: async (orderId: string, materials: Material[]): Promise<Material[]> => {
        const response = await client.post<Material[]>(`/tech/orders/${orderId}/materials`, { 
            materials: materials.map(m => ({
                name: m.name,
                sku: m.id || '',
                quantity: m.quantity,
                unit: m.unit || 'unit',
                cost: m.cost || 0
            }))
        });
        return response.data;
    },

    // Location
    updateLocation: async (lat: number, lng: number, orderId?: string): Promise<void> => {
        await client.post('/tech/location', null, {
            params: { lat, lng, ...(orderId && { orderId }) }
        });
    },

    // Status
    updateStatus: async (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'): Promise<void> => {
        const online = status === 'AVAILABLE' || status === 'BUSY';
        await client.post('/tech/status', null, {
            params: { online }
        });
    },

    // Profile
    getProfile: async (): Promise<TechnicianProfile> => {
        const response = await client.get<any>('/tech/profile');
        return mapProfileResponse(response.data);
    },

    updateProfile: async (data: Partial<TechnicianProfile>): Promise<TechnicianProfile> => {
        const response = await client.put<TechnicianProfile>('/tech/profile', data);
        return response.data;
    },

    uploadProfilePhoto: async (photo: File | string): Promise<TechnicianProfile> => {
        if (typeof photo === 'string') {
            const response = await client.post<any>('/tech/profile/avatar', null, {
                params: { photoBase64: photo }
            });
            return mapProfileResponse(response.data);
        }
        const formData = new FormData();
        formData.append('photo', photo);
        const response = await client.post<any>('/tech/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return mapProfileResponse(response.data);
    },

    // Documents
    getDocuments: async (): Promise<{ id: string; type: string; fileName: string; status: string; uploadedAt: string }[]> => {
        const response = await client.get('/tech/documents');
        return response.data;
    },

    uploadDocument: async (type: string, file: File): Promise<void> => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('file', file);
        await client.post('/tech/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Performance
    getPerformance: async (period?: '7d' | '30d' | '90d'): Promise<PerformanceMetrics> => {
        const params = period ? { period } : {};
        const response = await client.get<any>('/tech/performance', { params });
        return {
            period: response.data.period || '30d',
            jobsCompleted: response.data.jobsCompleted || 0,
            avgDuration: response.data.avgDuration || 0,
            onTimeRate: response.data.onTimeRate || 0,
            customerRating: response.data.customerRating || 5.0,
            earnings: response.data.earnings ? parseFloat(response.data.earnings.toString()) : 0
        };
    },

    // Notifications
    getNotifications: async (): Promise<Notification[]> => {
        const response = await client.get<any[]>('/tech/notifications');
        return response.data.map((n: any) => ({
            id: n.id,
            type: mapNotificationType(n.type),
            title: n.title,
            message: n.message,
            read: n.read === true,
            createdAt: n.createdAt
        }));
    },

    markNotificationRead: async (id: string): Promise<void> => {
        await client.patch(`/tech/notifications/${id}/read`);
    },

    // History
    getHistory: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<{ orders: AgendaItem[]; total: number }> => {
        const response = await client.get<{ orders: any[]; total: number }>('/tech/history', { params });
        return {
            orders: response.data.orders.map(mapOrderToAgendaItem),
            total: response.data.total
        };
    }
};

// Helper functions to map backend responses
function mapStatus(status: string): 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' {
    const statusMap: Record<string, 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
        'SCHEDULED': 'SCHEDULED',
        'IN_ROUTE': 'EN_ROUTE',
        'IN_PROGRESS': 'IN_PROGRESS',
        'COMPLETED': 'COMPLETED',
        'CANCELLED': 'CANCELLED',
        // API returns getValue() e.g. "scheduled", "in_route", "in_progress"
        'scheduled': 'SCHEDULED',
        'in_route': 'EN_ROUTE',
        'in_progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED',
    };
    const key = status?.toUpperCase?.()?.replace(/-/g, '_') ?? '';
    return statusMap[status] ?? statusMap[key] ?? 'SCHEDULED';
}

function mapPriority(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
        'LOW': 'LOW',
        'MEDIUM': 'MEDIUM',
        'HIGH': 'HIGH',
        'URGENT': 'URGENT'
    };
    return priorityMap[priority] || 'MEDIUM';
}

function mapOrderToAgendaItem(order: any): AgendaItem {
    return {
        id: order.id,
        orderNumber: order.osNumber,
        title: order.title,
        description: order.description,
        customer: {
            id: order.customerId || '',
            name: order.customerName || 'Cliente',
            phone: order.customerPhone || '',
            address: order.address?.street || order.address || '',
            coordinates: (order.addressLatitude != null && order.addressLongitude != null) 
                ? {
                    lat: order.addressLatitude,
                    lng: order.addressLongitude
                }
                : (order.address?.latitude != null && order.address?.longitude != null)
                    ? {
                        lat: order.address.latitude,
                        lng: order.address.longitude
                    }
                    : undefined
        },
        status: mapStatus(order.status),
        priority: mapPriority(order.priority),
        scheduledDate: order.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledStartTime: order.scheduledStart || '09:00',
        estimatedDuration: order.durationMinutes || 60,
        category: order.category || 'GENERAL',
        actualStartTime: order.actualStartTime || undefined,
        actualEndTime: order.actualEndTime || undefined
    };
}

function mapProfileResponse(profile: any): TechnicianProfile {
    return {
        id: profile.id,
        userId: profile.userId ?? profile.id,
        name: profile.name,
        email: profile.email,
        phone: '',
        avatarUrl: profile.avatarUrl,
        skills: profile.skills || [],
        rating: profile.rating || 5.0,
        totalJobs: 0,
        completionRate: 100,
        status: profile.isOnline ? 'AVAILABLE' : 'OFFLINE',
        vehicleModel: profile.vehicleModel,
        vehiclePlate: profile.vehiclePlate
    };
}

function mapNotificationType(type: string): 'NEW_JOB' | 'RESCHEDULE' | 'CANCELLATION' | 'MESSAGE' | 'SYSTEM' {
    const typeMap: Record<string, 'NEW_JOB' | 'RESCHEDULE' | 'CANCELLATION' | 'MESSAGE' | 'SYSTEM'> = {
        'ORDER_ASSIGNED': 'NEW_JOB',
        'ORDER_RESCHEDULED': 'RESCHEDULE',
        'ORDER_CANCELLED': 'CANCELLATION',
        'MESSAGE': 'MESSAGE',
        'SYSTEM': 'SYSTEM'
    };
    return typeMap[type] || 'SYSTEM';
}
