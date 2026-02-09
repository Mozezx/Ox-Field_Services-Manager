import client from './client';

export interface LoginRequest {
    email: string;
    password: string;
    appType: string;
    tenantDomain: string;
}

export interface RegisterTechnicianRequest {
    email: string;
    password: string;
    name: string;
    phone: string;
    tenantDomain?: string;
    inviteToken?: string;
    skills?: string[];
    vehicleModel?: string;
    vehiclePlate?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserInfo;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    avatarUrl?: string;
    tenantId?: string | null;
}

export interface TechnicianRegistrationResponse {
    userId: string;
    technicianId: string | null;
    message: string;
    status: string;
}

export const authService = {
    login: async (email: string, password: string, tenantDomain: string = 'demo.oxfield.com'): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/login', {
            email,
            password,
            appType: 'TECH_APP',
            tenantDomain
        });
        
        // Store tokens
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data;
    },

    register: async (data: RegisterTechnicianRequest): Promise<TechnicianRegistrationResponse> => {
        const response = await client.post<TechnicianRegistrationResponse>('/auth/register/tech', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
    },

    getCurrentUser: async (): Promise<UserInfo> => {
        const response = await client.get<UserInfo>('/auth/me');
        return response.data;
    },

    getStoredUser: (): UserInfo | null => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    /**
     * Link technician to a company using an invite token. Returns new tokens with tenant.
     */
    redeemInvite: async (inviteToken: string): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/technician/redeem-invite', {
            inviteToken: inviteToken.trim()
        });
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
    }
};

/** Public API: get tenant name/domain by domain (for join-by-link screen). No auth required. */
export const getTenantByDomain = async (domain: string): Promise<{ name: string; domain: string }> => {
    const response = await client.get<{ name: string; domain: string }>('/public/tenant-by-domain', {
        params: { domain: domain.trim() }
    });
    return response.data;
};

/** Public API: get tenant name/domain by invite token. No auth required. */
export const getTenantByInviteToken = async (token: string): Promise<{ name: string; domain: string }> => {
    const response = await client.get<{ name: string; domain: string }>('/public/tenant-by-invite', {
        params: { token: token.trim() }
    });
    return response.data;
};
