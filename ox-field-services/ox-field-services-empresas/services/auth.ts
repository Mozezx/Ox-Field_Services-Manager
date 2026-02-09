import client from './client';

export interface LoginRequest {
    email: string;
    password?: string;
    appType: string;
    tenantDomain: string;
}

export interface RegisterCompanyRequest {
    companyName: string;
    domain: string;
    adminEmail: string;
    password: string;
    adminName: string;
    phone?: string;
    region?: string;
    description?: string;
    logoUrl?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
    };
}

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    registerCompany: async (data: RegisterCompanyRequest): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/register/company', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        window.location.reload();
    }
};
