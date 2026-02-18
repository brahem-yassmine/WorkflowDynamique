// services/api.ts
import axios from 'axios';

// L'adresse de ton backend
const API_URL = 'http://localhost:5000/api'; // Change si ton backend est ailleurs

// Crée une instance d'axios (outil pour faire des requêtes HTTP)
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajoute automatiquement le token JWT dans les requêtes
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});