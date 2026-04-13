// hooks/useUser.ts - Version simple
import { useState, useEffect } from 'react';

const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = () => {
      try {
        const userData = localStorage.getItem('user');
        const tenantData = localStorage.getItem('tenant');

        if (userData) {
          setUser(JSON.parse(userData));
        }

        if (tenantData) {
          setTenant(JSON.parse(tenantData));
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return user.permissions?.includes(permission);
  };

  const btnDisabledClass = (permission: string) => {
    return hasPermission(permission) ? "" : "opacity-30 grayscale blur-[1px] pointer-events-none cursor-not-allowed";
  };

  return { user, tenant, loading, hasPermission, btnDisabledClass };
};

export default useUser;  // ⭐ EXPORT PAR DÉFAUT
