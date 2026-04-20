// front/app/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token and tenantId
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try different token names
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken');

    const tenantId = localStorage.getItem('tenantId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void, reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error.response && error.request;
    const isResponseError = !!error.response;

    if (error.response) {
      // Handle 401 Unauthorized globally
      if (error.response.status === 401 && typeof window !== 'undefined') {
        const originalRequest = error.config;
        
        // Prevent infinite loop if the refresh itself fails
        if (originalRequest.url?.includes('/api/auth/refresh')) {
          console.warn('⚡ [SessionShield] Refresh expired. Redirecting to signin...');
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          if (!window.location.pathname.includes('/signin')) {
            window.location.href = '/signin?error=session_expired';
          }
          return Promise.reject(error);
        }

        if (!originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = 'Bearer ' + token;
                return api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          return new Promise((resolve, reject) => {
            api.post('/api/auth/refresh', {}, { withCredentials: true })
              .then(({ data }) => {
                const newToken = data.data?.token;
                if (newToken) {
                  localStorage.setItem('auth_token', newToken);
                  localStorage.setItem('token', newToken);
                  api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
                  originalRequest.headers.Authorization = 'Bearer ' + newToken;
                  processQueue(null, newToken);
                  resolve(api(originalRequest));
                } else {
                  throw new Error('No token returned');
                }
              })
              .catch((err) => {
                processQueue(err, null);
                console.warn('⚡ [SessionShield] Refresh failed. Redirecting to signin...');
                localStorage.removeItem('token');
                localStorage.removeItem('auth_token');
                if (!window.location.pathname.includes('/signin')) {
                  window.location.href = '/signin?error=session_expired';
                }
                reject(err);
              })
              .finally(() => {
                isRefreshing = false;
              });
          });
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('❌ API Network Error (No Response):', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      });
      console.error('❌ API Network Error:', error.message);
    } else {
      console.error('❌ API Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);
