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

  return { user, tenant, loading };
};

export default useUser;  // ⭐ EXPORT PAR DÉFAUT
