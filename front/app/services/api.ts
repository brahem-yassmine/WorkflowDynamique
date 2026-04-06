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
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('❌ API Error Detail:', {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });

      // Handle 401 Unauthorized globally
      if (error.response.status === 401 && typeof window !== 'undefined') {
        console.warn('⚡ [SessionShield] Session expired or unauthorized. Redirecting to signin...');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        
        // Use window.location for hard redirect to ensure state is cleared
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin?error=session_expired';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('❌ API Network Error (No Response):', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('❌ API Request setup error:', error.message);
    }
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
