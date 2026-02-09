import axios from 'axios';

const client = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add token to requests
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - Handle token refresh and errors
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await client.post<{ accessToken: string }>('/auth/refresh', {
                        refreshToken,
                    });

                    const accessToken = response.data.accessToken;
                    if (accessToken) {
                        localStorage.setItem('token', accessToken);
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        return client(originalRequest);
                    }
                } catch {
                    // Refresh failed (expired or invalid)
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.hash = '#/login';
                return Promise.reject(error);
            }
            localStorage.removeItem('token');
            window.location.hash = '#/login';
        }

        return Promise.reject(error);
    }
);

export default client;
