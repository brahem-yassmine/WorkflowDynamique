import { useAuthContext } from '../context/AuthContext';
import { toast } from 'sonner';

export const usePermissions = () => {
  const { user, isAuthorized } = useAuthContext();
  
  const can = (permission: string): boolean => {
    return isAuthorized(permission);
  };

  const hasAny = (perms: string[]): boolean => {
    return perms.some(p => isAuthorized(p));
  };

  const handleRestrictedClick = (e: React.MouseEvent, permission: string) => {
    if (!can(permission)) {
      e.preventDefault();
      e.stopPropagation();
      toast.error(`Accès refusé`, {
        description: `La permission "${permission}" est requise pour cette action.`,
        duration: 3000,
      });
      return true;
    }
    return false;
  };

  // ✅ CSS Class for visual "grised" state only
  const permissionClass = (permission: string) => {
    return can(permission) ? "" : "opacity-40 grayscale transition-all duration-300";
  };

  // ✅ Original helper with pointer events (for direct logic gating)
  const permissionDisabledClass = (permission: string) => {
    return can(permission) ? "" : "opacity-40 grayscale cursor-not-allowed pointer-events-none transition-all duration-300";
  };

  const btnDisabledClass = (permission: string) => {
    return can(permission) ? "" : "opacity-50 grayscale cursor-not-allowed pointer-events-none shadow-none";
  };

  const rawRole = user?.role;
  const userRole = typeof rawRole === 'object' ? (rawRole as any)?.name || (rawRole as any)?.label || (rawRole as any)?.slug : rawRole;
  const roleString = String(userRole || '').toLowerCase();
  const isFullAccess = roleString.includes('admin') || user?.permissions?.includes('all');

  return { 
    can, 
    hasAny,
    user, 
    permissionClass,
    permissionDisabledClass, 
    btnDisabledClass,
    handleRestrictedClick,
    isFullAccess
  };
};
