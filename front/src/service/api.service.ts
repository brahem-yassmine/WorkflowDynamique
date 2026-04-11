const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
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

    const response = await fetch(`${API_URL}${endpoint}`, {
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

  // Modules Management
  getModules(domainId?: string) {
    const query = domainId ? `?domainId=${domainId}` : '';
    return this.request(`/modules${query}`);
  }

  createModule(data: any) {
    return this.request('/modules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateModule(id: string, data: any) {
    return this.request(`/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteModule(id: string) {
    return this.request(`/modules/${id}`, {
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

  // Task Management
  getMyTasks() {
    return this.request('/users/my/tasks');
  }

  getTaskById(id: string) {
    return this.request(`/tasks/${id}`);
  }

  updateTask(id: string, data: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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

  duplicateWorkflow(id: string, data?: any) {
    return this.request(`/workflows/${id}/duplicate`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  getWorkflowMembers(id: string) {
    return this.request(`/workflows/${id}/members`);
  }

  changeWorkflowStatus(id: string, status: string) {
    return this.request(`/workflows/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
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
  getChecklists(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/checklists${query}`);
  }

  toggleTaskStatus(id: string, taskId: string) {
    return this.request(`/checklists/${id}/tasks/${taskId}/toggle`, {
      method: 'PATCH'
    });
  }

  deleteChecklist(id: string) {
    return this.request(`/checklists/${id}`, {
      method: 'DELETE'
    });
  }

  // Notification Management
  getNotifications() {
    return this.request('/notifications');
  }

  createNotification(data: any) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
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

  approveNode(instanceId: string, nodeId: string, comment?: string, variables?: any) {
    return this.request(`/workflow-instances/${instanceId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        nodeId,
        comments: comment || '',
        data: variables || {}
      })
    });
  }

  updateNodeData(instanceId: string, nodeId: string, comment?: string, variables?: any) {
    return this.request(`/workflow-instances/${instanceId}/update-node`, {
      method: 'PATCH',
      body: JSON.stringify({
        nodeId,
        comments: comment || '',
        data: variables || {}
      })
    });
  }

  rejectNode(instanceId: string, nodeId: string, comment?: string) {
    return this.request(`/workflow-instances/${instanceId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        nodeId,
        comments: comment || ''
      })
    });
  }

  lockNode(instanceId: string, nodeId: string) {
    return this.request(`/workflow-instances/${instanceId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ nodeId })
    });
  }

  deleteInstance(instanceId: string) {
    return this.request(`/workflow-instances/${instanceId}`, {
      method: 'DELETE'
    });
  }

  // Board Management
  getBoards(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/boards${query}`);
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

  // Tenant Stats & Logs
  getTenantStats() {
    return this.request('/tenant/stats');
  }

  getTenantLogs() {
    return this.request('/tenant/logs');
  }

  // Task Reports (Admin to User)
  getTaskReports(all: boolean = false) {
    const endpoint = all ? '/task-reports/all' : '/task-reports/my-requests';
    return this.request(endpoint);
  }

  createTaskReport(data: any) {
    return this.request('/task-reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTaskReportStatus(id: string, status: string, response?: string) {
    return this.request(`/task-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, response })
    });
  }

  // Message Templates
  getMessageTemplates() {
    return this.request('/message-templates');
  }

  createMessageTemplate(data: any) {
    return this.request('/message-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateMessageTemplate(id: string, data: any) {
    return this.request(`/message-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteMessageTemplate(id: string) {
    return this.request(`/message-templates/${id}`, {
      method: 'DELETE'
    });
  }
}

export const apiService = new ApiService();
