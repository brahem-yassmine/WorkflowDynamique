'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  email: string;
  role: string;
  permissions: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthorized: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load from localStorage immediately on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = response.data.data;
        console.log('✅ [AuthContext] Profile refreshed:', {
          email: userData.email,
          role: userData.role,
          permissionsCount: userData.permissions?.length,
          isFullAccess: (userData.role?.toLowerCase() === 'admin' || userData.role?.toLowerCase() === 'super_admin' || userData.permissions?.includes('all'))
        });
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // If unauthorized, we might want to logout, but carefully
      if ((error as any).response?.status === 401) {
        // logout();
      }
    }
  }, []);

  // Periodic refresh or initial sync
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = (token: string, userData: any) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    setUser(null);
    router.push('/signin');
  };

  const normalizePermission = (perm: string) => {
    if (!perm || typeof perm !== 'string') return '';
    return perm.replace(/_/g, '.').toLowerCase();
  };

  const isAuthorized = useCallback((permission: string): boolean => {
    if (!user) {
      console.warn("🔐 [AuthCheck] No user data available yet.");
      return false;
    }
    
    const role = user.role?.toLowerCase();
    const isFullAccess = role === 'super_admin' || role === 'admin' || user.permissions?.includes('all');
    
    if (isFullAccess) return true;
    
    const normalizedTarget = normalizePermission(permission);
    const hasPerm = user.permissions?.some(p => normalizePermission(p) === normalizedTarget) ?? false;
    
    if (!hasPerm) {
      console.group(`🚫 [Access Denied] ${permission}`);
      console.log("Normalized Target:", normalizedTarget);
      console.log("User Permissions (original):", user.permissions);
      console.log("User Permissions (normalized):", user.permissions?.map(normalizePermission));
      console.groupEnd();
    }
    
    return hasPerm;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
