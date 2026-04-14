import { useAuth } from './useAuth';

/**
 * usePermissions
 * 
 * Functional hook to evaluate the current user's authority perimeter.
 * Enables high-fidelity visual and functional enforcement across the workspace.
 */
export const usePermissions = () => {
  const { user } = useAuth();

  // Extract identified permissions from the user profile
  const userPermissions = (user as any)?.permissions || [];
  
  // Super Admin Check (Full Matrix Authority)
  const isSuperAdmin = (user as any)?.role === 'super_admin' || userPermissions.includes('all');

  /**
   * can
   * Evaluates if a specific node configuration is granted in the matrix.
   */
  const can = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return userPermissions.includes(permission);
  };

  /**
   * hasAny
   * Check if user has at least one of the provided permissions.
   */
  const hasAny = (perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.some(p => userPermissions.includes(p));
  };

  return {
    can,
    hasAny,
    isSuperAdmin,
    permissions: userPermissions
  };
};
