import { useAuth } from './useAuth';

/**
 * usePermissions
 * 
 * Functional hook to evaluate the current user's authority perimeter.
 * Enables high-fidelity visual and functional enforcement across the workspace.
 */
export const usePermissions = () => {
  const { user } = useAuth();

  // Extract identified permissions and scope from the user profile
  const userPermissions = (user as any)?.permissions || [];
  const roleScope = (user as any)?.roleScope || null;

  // Full Matrix Authority Check (Super Admin, Admin) - User role doesn't get bypass anymore
  const isFullAccess = ['super_admin', 'admin'].includes((user as any)?.role?.toLowerCase()) || userPermissions.includes('all');

  /**
   * can
   * Evaluates if a specific node configuration is granted in the matrix.
   * Now includes Resource Perimeter Verification (context).
   */
  const can = (permission: string, context?: { domainId?: string, moduleId?: string }): boolean => {
    if (isFullAccess) return true;

    // 1. Check if the permission key exists
    const hasKey = userPermissions.some((p: string) => p.toLowerCase() === permission.toLowerCase());

    // 2. Special Exception: Module.VIEW is inherited if Domain scope matches and Domain.VIEW is present
    const isInheritedModuleView = permission === 'Module.VIEW' && 
                                 roleScope?.domainId && 
                                 userPermissions.some((p: string) => p.toLowerCase() === 'domain.view');

    if (!hasKey && !isInheritedModuleView) return false;

    // 3. Resource Perimeter Verification (Scoping)
    if (roleScope) {
      // If scoped to a Module
      if (roleScope.moduleId && context?.moduleId) {
        if (roleScope.moduleId.toString() !== context.moduleId.toString()) return false;
      }
      // If scoped to a Domain
      else if (roleScope.domainId && context?.domainId) {
        if (roleScope.domainId.toString() !== context.domainId.toString()) return false;
      }
    }

    return true;
  };

  /**
   * hasAny
   * Check if user has at least one of the provided permissions with context.
   */
  const hasAny = (perms: string[], context?: { domainId?: string, moduleId?: string }): boolean => {
    if (isFullAccess) return true;
    return perms.some(p => can(p, context));
  };

  /**
   * permissionDisabledClass
   * Generates a high-visibility lock for navigation or informational nodes.
   */
  const permissionDisabledClass = (permission: string, context?: { domainId?: string, moduleId?: string }) => {
    return can(permission, context) ? "" : "pointer-events-none cursor-not-allowed opacity-50";
  };

  /**
   * btnDisabledClass
   * Generates a high-restriction lock for specific execution buttons.
   */
  const btnDisabledClass = (permission: string, context?: { domainId?: string, moduleId?: string }) => {
    return can(permission, context) ? "" : "pointer-events-none cursor-not-allowed opacity-50";
  };

  /**
   * blurDisabledClass
   * Generates a high-restriction visual lock for selective nodes using blurring.
   */
  const blurDisabledClass = (permission: string, context?: { domainId?: string, moduleId?: string }) => {
    return can(permission, context) ? "" : "filter blur-[2px] opacity-60 grayscale pointer-events-none cursor-not-allowed transition-all duration-300";
  };

  return {
    can,
    hasAny,
    isFullAccess,
    permissionDisabledClass,
    btnDisabledClass,
    blurDisabledClass,
    permissions: userPermissions,
    roleScope
  };
};
