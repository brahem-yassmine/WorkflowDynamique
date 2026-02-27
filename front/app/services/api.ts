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
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken');

    const tenantId = localStorage.getItem('tenantId');

    console.log('🔍 Interceptor - values:', {
      token: token ? 'yes' : 'no',
      tenantId: tenantId ? tenantId : 'no'
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to header');
    } else {
      console.error('❌ Token missing in localStorage!');
    }

    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }
  return config;
});

// Log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    };
    console.error('❌ API Error Detail:', apiError);
    return Promise.reject(error);
  }
);