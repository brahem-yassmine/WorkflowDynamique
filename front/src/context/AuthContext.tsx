'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { normalizePermission } from '../lib/permission.utils';

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
    let token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    // Safety check: sometimes localStorage can contain the string "undefined" or "null"
    if (!token || token === 'undefined' || token === 'null') {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = response.data.data;
        console.log('✅ [AuthContext] Profile refreshed:', {
          email: userData.email,
          role: userData.role,
          permissionsCount: userData.permissions?.length
        });
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: any) {
      console.error('❌ [AuthContext] Error refreshing profile:', error.response?.data?.message || error.message);
      
      // If unauthorized (401), the token is likely expired or invalid
      if (error.response?.status === 401) {
        console.warn('🔐 [AuthContext] Session expired or invalid. Logging out.');
        logout();
      }
    } finally {
      setLoading(false);
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


  const isAuthorized = useCallback((permission: string): boolean => {
    if (!user) {
      console.warn("🔐 [AuthCheck] No user data available yet.");
      return false;
    }
    
    const rawRole = user.role;
    const userRole = typeof rawRole === 'object' ? (rawRole as any)?.name || (rawRole as any)?.label || (rawRole as any)?.slug : rawRole;
    const roleString = String(userRole || '').toLowerCase();
    
    const isFullAccess = 
      roleString.includes('admin') || 
      user.permissions?.includes('all') ||
      user.permissions?.map(p => p.toLowerCase()).includes('all');
    
    if (isFullAccess) return true;
    
    if (!user.permissions || !Array.isArray(user.permissions)) {
      console.warn("🔐 [AuthCheck] User has no permissions array.");
      return false;
    }

    // Use the ROBUST normalization for both the target and the list
    const normalizedTarget = normalizePermission(permission);
    
    // We do a "super-check" that handles both normalized and raw formats
    const hasPerm = user.permissions.some(p => {
      const normalizedP = normalizePermission(p);
      return normalizedP === normalizedTarget || p.toLowerCase() === permission.toLowerCase();
    });
    
    if (!hasPerm) {
      console.groupCollapsed(`🚫 [Access Denied] ${permission}`);
      console.log("Target String:", permission);
      console.log("Normalized Target:", normalizedTarget);
      console.log("User Permissions (original):", user.permissions);
      console.log("User Permissions (normalized):", user.permissions.map(normalizePermission));
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
