// front/app/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
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

    console.log('🔍 Interceptor - values:', {
      token: token ? 'yes' : 'no',
      tenantId: tenantId ? tenantId : 'no'
    });

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

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ API Response Error:', {
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.error || error.message,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });

      // Handle 401 Unauthorized globally
      if (error.response.status === 401 && typeof window !== 'undefined') {
        console.warn('⚡ [SessionShield] Session expired. Redirecting to signin...');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin?error=session_expired';
        }
      }
    } else if (error.request) {
      console.error('❌ API Network Error:', error.message);
    } else {
      console.error('❌ API Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);
