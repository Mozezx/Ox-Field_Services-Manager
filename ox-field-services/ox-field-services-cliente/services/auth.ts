import client from './client';

export interface LoginRequest {
    email: string;
    password: string;
    appType: string;
    // tenantDomain é opcional no marketplace - clientes são globais
    tenantDomain?: string;
}

export interface RegisterClientRequest {
    email: string;
    password: string;
    name: string;
    phone: string;
    // tenantDomain é opcional no marketplace - clientes são globais
    tenantDomain?: string;
    companyName?: string;
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
}

export const authService = {
    /**
     * Login de cliente no marketplace.
     * Clientes são globais (sem tenant fixo) e escolhem empresa por serviço.
     */
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/login', {
            email,
            password,
            appType: 'CLIENT_APP'
            // Sem tenantDomain - cliente global do marketplace
        });
        
        // Store tokens
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data;
    },

    /**
     * Registro de cliente no marketplace.
     * Clientes são globais (sem tenant fixo) e escolhem empresa por serviço.
     */
    register: async (data: Omit<RegisterClientRequest, 'tenantDomain'>): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/register/client', {
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone,
            companyName: data.companyName
            // Sem tenantDomain - cliente global do marketplace
        });
        
        // Store tokens
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.hash = '#/';
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
    }
};
