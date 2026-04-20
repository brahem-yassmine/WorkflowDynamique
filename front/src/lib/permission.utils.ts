// front/src/lib/permission.utils.ts

export const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
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
 */
export const normalizePermission = (perm: string): string => {
  if (!perm || typeof perm !== 'string') return '';
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
export const resolveDependencies = (selectedPermissions: string[]): string[] => {
  const normalizedInputs = selectedPermissions.map(normalizePermission);
  const result = new Set<string>(normalizedInputs);
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

/**
 * Checks if a specific permission is strictly required by any OTHER currently selected permission.
 */
export const isRequiredByOthers = (
  permissionToCheck: string, 
  currentPermissions: string[]
): boolean => {
  const normChecking = normalizePermission(permissionToCheck);
  return currentPermissions.some(perm => {
    const normCurrent = normalizePermission(perm);
    if (normCurrent === normChecking) return false;
    return resolveDependencies([normCurrent]).includes(normChecking);
  });
};

export const UI_GROUPS = {
  Dashboard: { icon: '📊', label: 'Dashboard', actions: ["VIEW"] },
  Domain: { icon: '📦', label: 'Domain', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Module: { icon: '🧩', label: 'Module', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Project: { icon: '📁', label: 'Project', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Workflow: { icon: '🔁', label: 'Workflow', actions: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  Template: { icon: '📄', label: 'Template', actions: ["VIEW", "CREATE", "UPDATE", "DELETE", "EXECUTE"] },
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
  "ASSIGN": "Can assign tasks to other users",
  "COMPLETE": "Can execute and validate tasks",
  "COMPLETE_ITEM": "Can check/uncheck checklist items"
};
