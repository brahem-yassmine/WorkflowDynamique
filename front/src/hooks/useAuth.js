'use client';

// hooks/useAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [subscriptionLimit, setSubscriptionLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const calculateExpiry = (userData) => {
    if (!userData) return { isExpired: false, daysRemaining: 15, limit: 15 };

    // 1. Check if backend explicitly says it's expired
    if (userData.subscriptionExpired) return { isExpired: true, daysRemaining: 0, limit: 15 };

    // 2. Client-side fallback calculation
    try {
      const plan = (localStorage.getItem('selectedPlan') || 'demo').toLowerCase();
      const startDateStr = localStorage.getItem('planStartDate') || userData.createdAt;
      const limit = plan.includes('demo') ? 7 : 15;

      if (startDateStr) {
        const start = new Date(startDateStr);
        const daysActive = Math.ceil(Math.abs(Date.now() - start.getTime()) / 86400000);
        const remaining = Math.max(0, limit - daysActive);
        const isExpired = daysActive >= limit;
        return { isExpired, daysRemaining: remaining, limit };
      }
    } catch (e) {
      console.error("Expiry calculation error:", e);
    }

    return { isExpired: false, daysRemaining: 15, limit: 15 };
  };

  const syncSubscription = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        const { isExpired, daysRemaining, limit } = calculateExpiry(userData);
        setSubscriptionExpired(isExpired);
        setDaysRemaining(daysRemaining);
        setSubscriptionLimit(limit);

        // Keep localStorage in sync
        if (userData.subscriptionExpired !== isExpired) {
          userData.subscriptionExpired = isExpired;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (e) {
        setSubscriptionExpired(false);
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Vérifier si le token est valide
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token} ` }
        });

        if (response.data.success) {
          const userData = response.data.data;
          setUser(userData);
          // Sync with local storage expiry state
          syncSubscription();
        } else {
          localStorage.removeItem('auth_token');
          router.push('/signin');
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        localStorage.removeItem('auth_token');
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for local changes to subscription state
    window.addEventListener('subscriptionChange', syncSubscription);
    window.addEventListener('storage', syncSubscription);

    return () => {
      window.removeEventListener('subscriptionChange', syncSubscription);
      window.removeEventListener('storage', syncSubscription);
    };
  }, [router]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenant');
    setUser(null);
    setSubscriptionExpired(false);
    router.push('/signin');
  };

  return { user, loading, logout, subscriptionExpired, daysRemaining, subscriptionLimit };
};