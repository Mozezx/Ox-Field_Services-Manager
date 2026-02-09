import axios from 'axios';

const client = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add logic to include token in requests (skip empty string to avoid invalid Bearer)
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && token.trim()) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401: clear session and reload so user is sent to login
client.interceptors.response.use(
    (r) => r,
    (err) => {
        const status = err.response?.status;
        if (status === 401) {
            localStorage.removeItem('token');
            // Reload so app shows login (initial state without token)
            window.location.reload();
            return Promise.reject(err);
        }
        if (status && status >= 500) {
            console.error('[API] Server error', status, err.response?.data ?? '(no body)');
        }
        return Promise.reject(err);
    }
);

export default client;
