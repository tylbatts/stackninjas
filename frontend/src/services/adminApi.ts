import axios from 'axios';
import keycloak from '../keycloak';

// Axios instance for Admin API calls
// Default to relative '/admin' if VITE_API_BASE_URL is not set
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/admin',
});

// Attach JWT token to each request
// Attach Keycloak token to each request
adminApi.interceptors.request.use((config) => {
  // Use dummy admin token if present (from localStorage), else fall back to Keycloak token
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken && config.headers) {
    config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  }
  const token = keycloak.token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminApi;