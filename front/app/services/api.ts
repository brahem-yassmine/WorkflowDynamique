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
    // Determine the nature of the error
    const isNetworkError = !error.response && error.request;
    const isResponseError = !!error.response;

    const apiError = {
      status: error.response?.status || (isNetworkError ? 'Network Error' : 'Unknown'),
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred',
      data: error.response?.data || null,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      timestamp: new Date().toISOString()
    };

    console.group('❌ API Error Detail');
    console.error('Context:', apiError);
    if (isResponseError) {
      console.error('Response Data:', error.response.data);
    } else if (isNetworkError) {
      console.error('Request Info:', error.request);
      console.error('Tip: Check CORS settings or if the backend is running correctly.');
    }
    console.groupEnd();

    return Promise.reject(error);
  }
);
