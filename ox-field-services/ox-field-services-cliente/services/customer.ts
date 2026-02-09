import client from './client';

// Types
export interface ServiceRequest {
    id: string;
    type: string;
    category: string;
    description?: string;
    address: {
        id: string;
        fullAddress: string;
        coordinates?: { lat: number; lng: number };
    };
    preferredDate?: string;
    preferredTime?: string;
    status: 'PENDING' | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

export interface PublicOrderByToken {
    orderId: string;
    orderNumber: string;
    title: string;
    status: string;
}

/** Address as returned by GET /customer/orders/{id} (CustomerOrderDetailResponse) */
export interface OrderAddress {
    id?: string;
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    isDefault?: boolean;
    latitude?: number | null;
    longitude?: number | null;
}

export interface ServiceOrder {
    id: string;
    orderNumber?: string;
    osNumber?: string;
    type?: string;
    status: 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    scheduledDate: string;
    scheduledTime?: string;
    scheduledStart?: string;
    estimatedDuration: number;
    durationMinutes?: number;
    technician?: {
        id: string;
        name: string;
        phone?: string;
        avatarUrl?: string;
        rating: number;
    };
    /** May be string (legacy) or OrderAddress when from getOrder detail */
    address?: string | OrderAddress;
    price?: number;
    notes?: string;
    description?: string;
    category?: string;
    estimatedPrice?: number;
    finalPrice?: number;
    createdAt?: string;
    completedAt?: string;
}

/** Raw response from GET /customer/orders/{id}/tracking (technicianLat/Lng only when within 200m) */
export interface TrackingApiResponse {
    orderId: string;
    isTracking: boolean;
    technicianLat: number | null;
    technicianLng: number | null;
    technicianName: string | null;
    etaMinutes: number | null;
}

export interface TrackingInfo {
    orderId: string;
    status: string;
    technicianLocation?: {
        lat: number;
        lng: number;
        updatedAt: string;
    };
    estimatedArrival?: string;
    currentStep: number;
    steps: {
        name: string;
        status: 'pending' | 'current' | 'completed';
        completedAt?: string;
    }[];
}

export interface Rating {
    orderId: string;
    rating: number;
    comment?: string;
    createdAt: string;
}

export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    createdAt: string;
}

export interface Address {
    id: string;
    label: string;
    fullAddress?: string; // Para compatibilidade com código existente
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
}

export interface PaymentMethod {
    id: string;
    type: 'credit_card' | 'debit_card' | 'pix';
    lastFour?: string;
    brand?: string;
    isDefault: boolean;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

// API Services
export const customerService = {
    // Service Requests
    /**
     * Cria uma solicitação de serviço.
     * No modelo marketplace, tenantId é obrigatório (empresa selecionada pelo cliente).
     */
    createServiceRequest: async (data: {
        type: string;
        category: string;
        description?: string;
        addressId: string;
        preferredDate?: string;
        preferredTime?: string;
        tenantId?: string; // Empresa selecionada no marketplace
    }): Promise<ServiceRequest> => {
        const response = await client.post<ServiceRequest>('/customer/service-requests', data);
        return response.data;
    },

    getServiceRequests: async (): Promise<ServiceRequest[]> => {
        const response = await client.get<ServiceRequest[]>('/customer/service-requests');
        return response.data;
    },

    getServiceRequest: async (id: string): Promise<ServiceRequest> => {
        const response = await client.get<ServiceRequest>(`/customer/service-requests/${id}`);
        return response.data;
    },

    cancelServiceRequest: async (id: string): Promise<void> => {
        await client.delete(`/customer/service-requests/${id}`);
    },

    // Orders
    getOrders: async (status?: string): Promise<ServiceOrder[]> => {
        const params = status ? { status } : {};
        const response = await client.get<ServiceOrder[]>('/customer/orders', { params });
        return response.data;
    },

    getOrder: async (id: string): Promise<ServiceOrder> => {
        const response = await client.get<ServiceOrder>(`/customer/orders/${id}`);
        return response.data;
    },

    /** Public: get minimal order info by share token (no auth). */
    getOrderByToken: async (token: string): Promise<PublicOrderByToken> => {
        const response = await client.get<PublicOrderByToken>('/public/orders/by-token', { params: { token } });
        return response.data;
    },

    /** Public: get tenant name by client invite token (no auth). */
    getJoinByToken: async (token: string): Promise<{ name: string; tenantId: string }> => {
        const response = await client.get<{ name: string; tenantId: string }>('/public/join-by-token', { params: { token } });
        return response.data;
    },

    /** Join company by invite token (associate current customer with company). Requires auth. */
    joinCompanyByToken: async (token: string): Promise<{ companyName: string }> => {
        const response = await client.post<{ companyName: string }>('/customer/join', { token });
        return response.data;
    },

    /** Join company by tenant ID (e.g. "Tornar-me cliente" from app). Requires auth. */
    joinCompanyByTenantId: async (tenantId: string): Promise<{ companyName: string }> => {
        const response = await client.post<{ companyName: string }>('/customer/join', { tenantId });
        return response.data;
    },

    /** Claim order by share token (associate to current customer). Requires auth. */
    claimOrder: async (token: string): Promise<ServiceOrder> => {
        const response = await client.post<ServiceOrder>('/customer/orders/claim', { token });
        return response.data;
    },

    /** Backend returns technicianLat/technicianLng (only when technician within 200m). Map to TrackingInfo. */
    getOrderTracking: async (id: string): Promise<TrackingInfo> => {
        const response = await client.get<TrackingApiResponse>(`/customer/orders/${id}/tracking`);
        const data = response.data;
        const technicianLocation =
            data.technicianLat != null && data.technicianLng != null
                ? {
                      lat: data.technicianLat,
                      lng: data.technicianLng,
                      updatedAt: new Date().toISOString(),
                  }
                : undefined;
        return {
            orderId: data.orderId,
            status: data.isTracking ? 'EN_ROUTE' : 'SCHEDULED',
            technicianLocation,
            estimatedArrival: undefined,
            currentStep: 0,
            steps: [
                { name: 'Technician en route', status: 'current' },
                { name: 'Arrived', status: 'pending' },
                { name: 'Service Started', status: 'pending' },
            ],
        };
    },

    rateOrder: async (orderId: string, rating: number, comment?: string): Promise<Rating> => {
        const response = await client.post<Rating>(`/customer/orders/${orderId}/rating`, {
            rating,
            comment
        });
        return response.data;
    },

    // Profile
    getProfile: async (): Promise<CustomerProfile> => {
        const response = await client.get<CustomerProfile>('/customer/profile');
        return response.data;
    },

    updateProfile: async (data: Partial<CustomerProfile>): Promise<CustomerProfile> => {
        const response = await client.put<CustomerProfile>('/customer/profile', data);
        return response.data;
    },

    // Addresses
    getAddresses: async (): Promise<Address[]> => {
        const response = await client.get<Address[]>('/customer/addresses');
        // Construir fullAddress para cada endereço se não existir
        return response.data.map(addr => ({
            ...addr,
            fullAddress: addr.fullAddress || 
                `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}${addr.postalCode ? ' - ' + addr.postalCode : ''}`.replace(/^,\s*|,\s*$/g, ''),
            coordinates: addr.latitude && addr.longitude 
                ? { lat: addr.latitude, lng: addr.longitude }
                : addr.coordinates
        }));
    },

    /**
     * Adiciona um novo endereço.
     * @param data - Dados do endereço (label, street, city, state, postalCode, country, latitude, longitude, isDefault)
     */
    addAddress: async (data: {
        label: string;
        street: string;
        city: string;
        state: string;
        postalCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
        isDefault?: boolean;
    }): Promise<Address> => {
        const response = await client.post<Address>('/customer/addresses', data);
        // Construir fullAddress para compatibilidade
        const fullAddress = `${data.street}, ${data.city}, ${data.state}${data.postalCode ? ' - ' + data.postalCode : ''}`;
        return {
            ...response.data,
            fullAddress: response.data.fullAddress || fullAddress,
            coordinates: response.data.latitude && response.data.longitude 
                ? { lat: response.data.latitude, lng: response.data.longitude }
                : undefined
        };
    },

    updateAddress: async (id: string, data: Partial<Address>): Promise<Address> => {
        const response = await client.put<Address>(`/customer/addresses/${id}`, data);
        return response.data;
    },

    deleteAddress: async (id: string): Promise<void> => {
        await client.delete(`/customer/addresses/${id}`);
    },

    // Payment Methods
    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
        const response = await client.get<PaymentMethod[]>('/customer/payment-methods');
        return response.data;
    },

    addPaymentMethod: async (data: {
        type: string;
        token: string;
    }): Promise<PaymentMethod> => {
        const response = await client.post<PaymentMethod>('/customer/payment-methods', data);
        return response.data;
    },

    deletePaymentMethod: async (id: string): Promise<void> => {
        await client.delete(`/customer/payment-methods/${id}`);
    },

    setDefaultPaymentMethod: async (id: string): Promise<void> => {
        await client.patch(`/customer/payment-methods/${id}/default`);
    },

    // Support
    createSupportTicket: async (data: {
        subject: string;
        description: string;
        orderId?: string;
    }): Promise<SupportTicket> => {
        const response = await client.post<SupportTicket>('/customer/support/tickets', data);
        return response.data;
    },

    getSupportTickets: async (): Promise<SupportTicket[]> => {
        const response = await client.get<SupportTicket[]>('/customer/support/tickets');
        return response.data;
    },

    getFAQ: async (): Promise<FAQ[]> => {
        const response = await client.get<FAQ[]>('/customer/support/faq');
        return response.data;
    },

    // ========== Payments ==========

    initiatePayment: async (orderId: string, paymentMethodId?: string): Promise<PaymentIntentResponse> => {
        const response = await client.post<PaymentIntentResponse>(`/customer/orders/${orderId}/pay`, {
            paymentMethodId
        });
        return response.data;
    },

    confirmPayment: async (orderId: string, paymentIntentId: string): Promise<PaymentConfirmationResponse> => {
        const response = await client.post<PaymentConfirmationResponse>(`/customer/orders/${orderId}/confirm-payment`, {
            paymentIntentId
        });
        return response.data;
    },

    getPaymentHistory: async (): Promise<PaymentHistoryRecord[]> => {
        const response = await client.get<PaymentHistoryRecord[]>('/customer/payments');
        return response.data;
    },

    addPaymentMethodStripe: async (data: {
        paymentMethodId: string;
        last4: string;
        brand: string;
        expiresAt: string;
    }): Promise<PaymentMethodResponse> => {
        const response = await client.post<PaymentMethodResponse>('/customer/payment-methods', data);
        return response.data;
    },

    listPaymentMethodsStripe: async (): Promise<PaymentMethodResponse[]> => {
        const response = await client.get<PaymentMethodResponse[]>('/customer/payment-methods');
        return response.data;
    }
};

// ========== Payment Types ==========

export interface PaymentIntentResponse {
    clientSecret: string;
    amount: number;
    currency: string;
}

export interface PaymentConfirmationResponse {
    success: boolean;
    message: string;
    transactionId: string;
    amount: number;
}

export interface PaymentHistoryRecord {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    serviceTitle: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
    paidAt: string;
    paymentMethod: string;
}

export interface PaymentMethodResponse {
    id: string;
    type: string;
    last4: string;
    brand: string;
    expiresAt: string;
    isDefault: boolean;
}
