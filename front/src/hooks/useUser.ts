'use client';

import { useAuthContext } from '../context/AuthContext';
import { usePermissions } from './usePermissions';

/**
 * useUser hook (Context Wrapper)
 * 
 * Centralized hook for user profile data and simple permission checks.
 * Consolidated to use AuthContext and usePermissions for a single source of truth.
 */
const useUser = () => {
  const { user, loading } = useAuthContext();
  const { can, btnDisabledClass, permissionDisabledClass } = usePermissions();

  return { 
    user, 
    loading, 
    hasPermission: can, 
    btnDisabledClass,
    permissionDisabledClass
  };
};

export default useUser;
