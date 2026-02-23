// front/app/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter token et tenantId
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Essaie différents noms de token
    const token = 
      localStorage.getItem('token') || 
      localStorage.getItem('auth_token') || 
      localStorage.getItem('accessToken');
      
    const tenantId = localStorage.getItem('tenantId');
    
    console.log('🔍 Intercepteur - valeurs:', { 
      token: token ? 'oui' : 'non', 
      tenantId: tenantId ? tenantId : 'non' 
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token ajouté au header');
    } else {
      console.error('❌ Token manquant dans localStorage!');
    }
    
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }
  return config;
});

// Log les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erreur API:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);