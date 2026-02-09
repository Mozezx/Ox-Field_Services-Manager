import client from './client';

export interface LoginRequest {
    email: string;
    password: string;
    appType: string;
    tenantDomain: string;
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
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/login', {
            email,
            password,
            appType: 'ADMIN_GLOBAL',
            tenantDomain: 'demo.oxfield.com'
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
        window.location.href = '/';
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
