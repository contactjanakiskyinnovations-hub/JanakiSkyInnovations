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

// In-memory request deduplication and short-lived GET cache for static/cms endpoints
const getCache = new Map();
const inFlightRequests = new Map();
const CACHEABLE_PREFIXES = ['/api/cms', '/api/categories'];

const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);
const originalPut = api.put.bind(api);
const originalDelete = api.delete.bind(api);

api.get = function (url, config) {
    const isCacheable = CACHEABLE_PREFIXES.some(prefix => String(url).startsWith(prefix));

    if (isCacheable) {
        const cached = getCache.get(url);
        if (cached && (Date.now() - cached.timestamp < 12000)) {
            return Promise.resolve({ ...cached.response });
        }
    }

    if (inFlightRequests.has(url)) {
        return inFlightRequests.get(url);
    }

    const requestPromise = originalGet(url, config)
        .then((response) => {
            if (isCacheable) {
                getCache.set(url, { timestamp: Date.now(), response });
            }
            return response;
        })
        .finally(() => {
            inFlightRequests.delete(url);
        });

    inFlightRequests.set(url, requestPromise);
    return requestPromise;
};

// Invalidate cache on mutations
const clearCacheForUrl = (url) => {
    if (!url) {
        getCache.clear();
        return;
    }
    for (const key of getCache.keys()) {
        if (key.includes('cms') || key.includes('categories')) {
            getCache.delete(key);
        }
    }
};

api.post = function (url, data, config) {
    clearCacheForUrl(url);
    return originalPost(url, data, config);
};

api.put = function (url, data, config) {
    clearCacheForUrl(url);
    return originalPut(url, data, config);
};

api.delete = function (url, config) {
    clearCacheForUrl(url);
    return originalDelete(url, config);
};

export default api;
