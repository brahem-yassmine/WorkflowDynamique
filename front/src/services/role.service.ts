// front/src/services/api.service.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken');
  }

  private getTenantId(): string | null {
    if (typeof window === 'undefined') return null;

    // 1. D'abord essayer de récupérer depuis le localStorage
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) return tenantId;

    // 2. Fallback : essayer de décoder le token
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tenantId || null;
      } catch (e) {
        console.error('Erreur décodage token:', e);
      }
    }

    return null;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const tenantId = this.getTenantId();

    if (!token) {
      throw new Error('Non authentifié');
    }

    // Préparer les headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };

    // 👇 SOLUTION PRO : Ajouter tenantId dans le header si présent
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Gestion des erreurs d'authentification
    if (response.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
      throw new Error('Session expirée');
    }

    // Gestion de l'erreur Tenant ID requis
    if (response.status === 400 && (data.message?.includes('Tenant ID requis'))) {
      console.error('Tenant ID manquant. Détails:', data.message);
      throw new Error('Identifiant d\'organisation manquant ou invalide. Reconnectez-vous.');
    }

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: Impossible de traiter la demande`);
    }

    return data;
  }

  // Méthodes spécifiques
  getRoles() {
    return this.request('/tenant/roles');
  }

  createRole(data: any) {
    return this.request('/tenant/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateRole(id: string, data: any) {
    return this.request(`/tenant/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteRole(id: string) {
    return this.request(`/tenant/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Domains Management
  getDomains() {
    return this.request('/tenant/domains');
  }

  createDomain(data: any) {
    return this.request('/tenant/domains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateDomain(id: string, data: any) {
    return this.request(`/tenant/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteDomain(id: string) {
    return this.request(`/tenant/domains/${id}`, {
      method: 'DELETE',
    });
  }

  // User Management
  getUsers() {
    return this.request('/users');
  }

  createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();