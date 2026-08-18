import axios from 'axios';

// Base URL comes from the environment (set VITE_API_URL when deploying, e.g.
// https://api.yourstore.com). Falls back to the local dev server.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        let token = null;

        // Check if we are inside the admin portal
        const isAdminPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

        if (isAdminPortal) {
            const adminInfo = localStorage.getItem('adminInfo');
            if (adminInfo) {
                const parsedAdmin = JSON.parse(adminInfo);
                token = parsedAdmin.token;
            }
        }

        // Fallback to storefront customer token if not in admin portal or admin token not found
        if (!token) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const parsedUser = JSON.parse(userInfo);
                token = parsedUser.token;
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
