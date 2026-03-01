// hooks/useAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setUser(response.data.data);
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
  }, [router]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/signin');
  };

  return { user, loading, logout };
};
