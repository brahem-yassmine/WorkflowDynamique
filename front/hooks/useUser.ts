// hooks/useUser.ts - Version simple
import { useState, useEffect } from 'react';

const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = () => {
      try {
        const userData = localStorage.getItem('user');
        
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};

export default useUser;  // ⭐ EXPORT PAR DÉFAUT