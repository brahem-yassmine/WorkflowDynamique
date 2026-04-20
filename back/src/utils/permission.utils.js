const PERMISSION_DEPENDENCIES = {
  // Domain rules
  'Domain.VIEW': [],
  'Domain.CREATE': ['Domain.VIEW'],
  'Domain.UPDATE': ['Domain.VIEW'],
  'Domain.DELETE': ['Domain.VIEW'],
  
  // Module rules
  'Module.VIEW': ['Domain.VIEW'],
  'Module.CREATE': ['Module.VIEW', 'Domain.VIEW'], 
  'Module.UPDATE': ['Module.VIEW', 'Domain.VIEW'],
  'Module.DELETE': ['Module.VIEW', 'Domain.VIEW'],

  // Project rules
  'Project.VIEW': ['Domain.VIEW'],
  'Project.CREATE': ['Project.VIEW', 'Domain.VIEW'], 
  'Project.UPDATE': ['Project.VIEW'],
  'Project.DELETE': ['Project.VIEW'],

  // Workflow rules
  'Workflow.VIEW': ['Project.VIEW', 'Domain.VIEW'],
  'Workflow.CREATE': ['Workflow.VIEW', 'Project.VIEW', 'Form.CREATE', 'Domain.VIEW'], 
  'Workflow.UPDATE': ['Workflow.VIEW', 'Project.VIEW'],
  'Workflow.DELETE': ['Workflow.VIEW', 'Project.VIEW'],

  // Template rules
  'Template.VIEW': ['Module.VIEW', 'Domain.VIEW'],
  'Template.CREATE': ['Template.VIEW', 'Domain.VIEW', 'Module.VIEW'],
  'Template.UPDATE': ['Template.VIEW', 'Module.VIEW', 'Domain.VIEW'],
  'Template.DELETE': ['Template.VIEW', 'Module.VIEW', 'Domain.VIEW'],
  'Template.EXECUTE': ['Template.VIEW', 'Project.VIEW', 'Workflow.VIEW'],

  // Form rules
  'Form.VIEW': ['Domain.VIEW'],
  'Form.CREATE': ['Form.VIEW'],
  'Form.UPDATE': ['Form.VIEW'],
  'Form.DELETE': ['Form.VIEW'],
  'Form.CLONE': ['Form.VIEW'],

  // Checklist rules
  'Checklist.VIEW': ['Workflow.VIEW'],
  'Checklist.CREATE': ['Checklist.VIEW', 'Workflow.CREATE'],
  'Checklist.UPDATE': ['Checklist.VIEW'],
  'Checklist.DELETE': ['Checklist.VIEW'],
  'Checklist.COMPLETE_ITEM': ['Checklist.VIEW'],

  // Kanban rules
  'Kanban.VIEW': ['Project.VIEW'],
  'Kanban.CREATE': ['Kanban.VIEW', 'Project.VIEW', 'Project.CREATE', 'Domain.VIEW', 'Domain.CREATE', 'Workflow.VIEW', 'Workflow.CREATE', 'Module.VIEW', 'Module.CREATE'],
};

/**
 * Normalizes a permission string to a standard format (Entity.ACTION)
 * Handles both "PROJECT_VIEW" and "Project.VIEW" formats and case differences.
 */
const normalizePermission = (perm) => {
  if (!perm || typeof perm !== 'string') return '';
  // Convert PROJECT_VIEW to Project.VIEW format internally for matching
  const parts = perm.replace(/_/g, '.').split('.');
  if (parts.length === 2) {
    const entity = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const action = parts[1].toUpperCase();
    return `${entity}.${action}`;
  }
  return perm;
};

/**
 * Recursively resolves all required dependencies for an array of permissions.
 */
const resolveDependencies = (selectedPermissions) => {
  if (!Array.isArray(selectedPermissions)) return [];
  
  // Normalize everything to Entity.ACTION for consistent lookup
  const normalizedInputs = selectedPermissions.map(normalizePermission);
  const result = new Set(normalizedInputs);
  let size;
  
  do {
    size = result.size;
    result.forEach(perm => {
      const deps = PERMISSION_DEPENDENCIES[perm];
      if (deps) {
        deps.forEach(dep => result.add(normalizePermission(dep)));
      }
    });
  } while (result.size > size); 
  
  return Array.from(result);
};

module.exports = {
  PERMISSION_DEPENDENCIES,
  resolveDependencies,
  normalizePermission
};
