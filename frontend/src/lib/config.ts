// API Configuration
const isDevelopment = import.meta.env.DEV;
const isDocker = import.meta.env.VITE_DOCKER === 'true';

// In development with Vite, we use the proxy configured in vite.config.ts
// In Docker/production, we use relative URLs (same origin) or the backend URL
export const API_BASE_URL = isDevelopment && !isDocker 
  ? ''  // Uses Vite proxy
  : (isDocker ? 'http://localhost:3000/api' : '/api');
