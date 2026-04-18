const PERMISSION_DEPENDENCIES = {
  // Domain rules
  'Domain.CREATE': ['Domain.VIEW'],
  'Domain.UPDATE': ['Domain.VIEW'],
  'Domain.DELETE': ['Domain.VIEW'],
  
  // Module rules
  'Module.VIEW': ['Domain.VIEW'],
  'Module.CREATE': ['Module.VIEW', 'Domain.VIEW'], 
  'Module.UPDATE': ['Module.VIEW', 'Domain.VIEW'],
  'Module.DELETE': ['Module.VIEW', 'Domain.VIEW'],

  // Project rules
  'Project.CREATE': ['Project.VIEW', 'Domain.VIEW'], // Hierarchy
  'Project.UPDATE': ['Project.VIEW'],
  'Project.DELETE': ['Project.VIEW'],

  // Workflow rules
  'Workflow.VIEW': ['Project.VIEW'],
  'Workflow.CREATE': ['Workflow.VIEW', 'Project.VIEW', 'Form.CREATE'], 
  'Workflow.UPDATE': ['Workflow.VIEW', 'Project.VIEW'],
  'Workflow.DELETE': ['Workflow.VIEW', 'Project.VIEW'],
  'Workflow.EXECUTE': ['Workflow.VIEW', 'Project.VIEW'], 

  // Template rules
  'Template.VIEW': ['Module.VIEW', 'Domain.VIEW'],
  'Template.CREATE': ['Template.VIEW', 'Domain.VIEW', 'Module.VIEW'],
  'Template.UPDATE': ['Template.VIEW', 'Module.VIEW', 'Domain.VIEW'],
  'Template.DELETE': ['Template.VIEW', 'Module.VIEW', 'Domain.VIEW'],
  'Template.CLONE_TEMPLATE': ['Template.VIEW', 'Workflow.CREATE', 'Project.VIEW'],

  // Form rules
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
 * Recursively resolves all required dependencies for an array of permissions.
 */
const resolveDependencies = (selectedPermissions) => {
  if (!Array.isArray(selectedPermissions)) return [];
  const result = new Set(selectedPermissions);
  let size;
  
  do {
    size = result.size;
    result.forEach(perm => {
      if (PERMISSION_DEPENDENCIES[perm]) {
        PERMISSION_DEPENDENCIES[perm].forEach(dep => result.add(dep));
      }
    });
  } while (result.size > size); 
  
  return Array.from(result);
};

module.exports = {
  PERMISSION_DEPENDENCIES,
  resolveDependencies
};
