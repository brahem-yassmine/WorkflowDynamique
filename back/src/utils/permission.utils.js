const PERMISSION_DEPENDENCIES = {
  // Domain rules
  'Domain.CREATE': ['Domain.VIEW'],
  'Domain.UPDATE': ['Domain.VIEW'],
  'Domain.DELETE': ['Domain.VIEW'],
  
  // Module rules
  'Module.CREATE': ['Module.VIEW', 'Domain.VIEW'], // Hierarchy
  'Module.UPDATE': ['Module.VIEW'],
  'Module.DELETE': ['Module.VIEW'],

  // Project rules
  'Project.CREATE': ['Project.VIEW', 'Domain.VIEW'], // Hierarchy
  'Project.UPDATE': ['Project.VIEW'],
  'Project.DELETE': ['Project.VIEW'],

  // Workflow rules
  'Workflow.CREATE': ['Workflow.VIEW', 'Project.VIEW', 'Form.CREATE'], // Hierarchy + Form
  'Workflow.UPDATE': ['Workflow.VIEW'],
  'Workflow.DELETE': ['Workflow.VIEW'],
  'Workflow.EXECUTE': ['Workflow.VIEW'], // Must view to launch

  // Template rules
  'Template.CREATE': ['Template.VIEW', 'Domain.VIEW', 'Module.VIEW'],
  'Template.UPDATE': ['Template.VIEW'],
  'Template.DELETE': ['Template.VIEW'],
  'Template.CLONE_TEMPLATE': ['Template.VIEW', 'Workflow.CREATE', 'Project.VIEW'],

  // Form rules
  'Form.CREATE': ['Form.VIEW'],
  'Form.UPDATE': ['Form.VIEW'],
  'Form.DELETE': ['Form.VIEW'],

  // Checklist rules
  'Checklist.COMPLETE_ITEM': ['Checklist.VIEW'],

  // Kanban rules
  'Kanban.VIEW': ['Project.VIEW'],
  'Kanban.CREATE': ['Kanban.VIEW', 'Project.VIEW', 'Workflow.CREATE','Domain.VIEW'],
  
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
