'use client';

import { useAuthContext } from '../context/AuthContext';

/**
 * useAuth hook (Context Wrapper)
 * 
 * Provides unified access to authentication state and profile data.
 * Now acts as a bridge to AuthContext to ensure app-wide reactivity.
 */
export const useAuth = () => {
  const { user, loading, login, logout, refreshProfile } = useAuthContext();

  return {
    user,
    loading,
    login,
    logout,
    checkAuth: refreshProfile, // keeping mapping for compatibility
    refreshProfile
  };
};
