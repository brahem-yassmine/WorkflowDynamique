// front/src/services/api.service.ts
const API_URL = 'http://localhost:5000/api';

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken');
  }

  private getTenantId(): string | null {
    if (typeof window === 'undefined') return null;

    // 1. Try to get from localStorage first
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) return tenantId;

    // 2. Fallback: try to decode token
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tenantId || null;
      } catch (e) {
        console.error('Token decoding error:', e);
      }
    }

    return null;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const tenantId = this.getTenantId();

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };

    // PRO SOLUTION: Add tenantId in header if present
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }

    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await response.json();

    // Authentication error handling
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
      throw new Error('Session expired');
    }

    // Tenant ID required error handling
    if (response.status === 400 && (data.message?.includes('Tenant ID requis') || data.message?.includes('Tenant ID required'))) {
      console.error('Missing Tenant ID. Details:', data.message);
      throw new Error('Missing or invalid organization identifier. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: Unable to process request`);
    }

    return data;
  }

  // Specific methods
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

  // Workflow Management
  getWorkflows() {
    return this.request('/workflows');
  }

  getWorkflowById(id: string) {
    return this.request(`/workflows/${id}`);
  }

  createWorkflow(data: any) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWorkflow(id: string, data: any) {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  duplicateWorkflow(id: string) {
    return this.request(`/workflows/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Project Management
  getProjects() {
    return this.request('/projects');
  }

  getProjectById(id: string) {
    return this.request(`/projects/${id}`);
  }

  createProject(data: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateProject(id: string, data: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Form Management
  getForms() {
    return this.request('/forms');
  }

  updateForm(id: string, data: any) {
    return this.request(`/forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Checklist Management
  getChecklists() {
    return this.request('/checklists');
  }

  // Notification Management
  getNotifications() {
    return this.request('/notifications');
  }

  markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  // Workflow Instance Management
  createInstance(data: any) {
    return this.request('/workflow-instances', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getInstances(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/workflow-instances${query}`);
  }

  getInstance(id: string) {
    return this.request(`/workflow-instances/${id}`);
  }

  approveNode(instanceId: string, nodeId: string, data?: any) {
    return this.request(`/workflow-instances/${instanceId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        nodeId,
        comments: data?.comment || '',
        data: data?.variables || {}
      })
    });
  }

  rejectNode(instanceId: string, nodeId: string) {
    return this.request(`/workflow-instances/${instanceId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ nodeId })
    });
  }

  // Board Management
  getBoards() {
    return this.request('/boards');
  }

  createBoard(data: any) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteBoard(id: string) {
    return this.request(`/boards/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();