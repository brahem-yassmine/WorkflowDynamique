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

  // Full Matrix Authority Check (Super Admin, Admin, and User)
  const isFullAccess = ['super_admin', 'admin', 'user'].includes((user as any)?.role?.toLowerCase()) || userPermissions.includes('all');

  /**
   * can
   * Evaluates if a specific node configuration is granted in the matrix.
   */
  const can = (permission: string): boolean => {
    if (isFullAccess) return true;
    return userPermissions.some((p: string) => p.toLowerCase() === permission.toLowerCase());
  };

  /**
   * hasAny
   * Check if user has at least one of the provided permissions.
   */
  const hasAny = (perms: string[]): boolean => {
    if (isFullAccess) return true;
    return perms.some(p => userPermissions.some((up: string) => up.toLowerCase() === p.toLowerCase()));
  };

  /**
   * permissionDisabledClass
   * Generates a high-visibility lock for navigation or informational nodes (No Blur).
   */
  const permissionDisabledClass = (permission: string) => {
    return can(permission) ? "" : "pointer-events-none cursor-not-allowed";
  };

  /**
   * btnDisabledClass
   * Generates a high-restriction lock for specific execution buttons (No Blur).
   */
  const btnDisabledClass = (permission: string) => {
    return can(permission) ? "" : "pointer-events-none cursor-not-allowed";
  };

  /**
   * blurDisabledClass
   * Generates a high-restriction visual lock for selective nodes using blurring.
   */
  const blurDisabledClass = (permission: string) => {
    return can(permission) ? "" : "filter blur-[2px] opacity-60 grayscale pointer-events-none cursor-not-allowed transition-all duration-300";
  };

  return {
    can,
    hasAny,
    isFullAccess,
    permissionDisabledClass,
    btnDisabledClass,
    blurDisabledClass,
    permissions: userPermissions
  };
};
