// front/src/lib/permission.utils.ts

export const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
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
export const resolveDependencies = (selectedPermissions: string[]): string[] => {
  const result = new Set<string>(selectedPermissions);
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

/**
 * Checks if a specific permission is strictly required by any OTHER currently selected permission.
 */
export const isRequiredByOthers = (
  permissionToCheck: string, 
  currentPermissions: string[]
): boolean => {
  return currentPermissions.some(perm => {
    if (perm === permissionToCheck) return false;
    return resolveDependencies([perm]).includes(permissionToCheck);
  });
};

export const UI_GROUPS = {
  Domain: { icon: '📦', label: 'Domain', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Module: { icon: '🧩', label: 'Module', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Project: { icon: '📁', label: 'Project', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Workflow: { icon: '🔁', label: 'Workflow', actions: ["VIEW", "CREATE", "UPDATE", "DELETE", "EXECUTE"] },
  Template: { icon: '📄', label: 'Template', actions: ["VIEW", "CREATE", "UPDATE", "DELETE", "CLONE_TEMPLATE"] },
  Form: { icon: '📝', label: 'Form', actions: ["VIEW", "CREATE", "UPDATE", "DELETE", "CLONE"] },
  Checklist: { icon: '✅', label: 'Checklist', actions: ["VIEW", "COMPLETE_ITEM"] },
  Kanban: { icon: '🗂️', label: 'Kanban', actions: ["VIEW", "CREATE"] },
};

export const ACTION_TOOLTIPS: Record<string, string> = {
  "CREATE": "Can create new items",
  "UPDATE": "Can edit existing items",
  "DELETE": "Can remove items",
  "VIEW": "Can view items",
  "CLONE": "Can duplicate this item",
  "EXECUTE": "Can launch and use workflows",
  "CLONE_TEMPLATE": "Can duplicate template to a project",
  "ASSIGN": "Can assign tasks to other users",
  "COMPLETE": "Can execute and validate tasks",
  "COMPLETE_ITEM": "Can check/uncheck checklist items"
};
