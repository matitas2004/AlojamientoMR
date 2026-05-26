import axios from 'axios';
import axiosRetry from 'axios-retry';
// ARQUITECTURA: Backend-for-Frontend (BFF) con API Routes
// ========================================================
// El navegador NUNCA llama directamente a Render.
// En su lugar, llama a /api/alojamientos (en nuestro propio Next.js).
// Next.js tiene archivos en src/app/api/ que reciben la petición
// y la reenvían a Render desde el SERVIDOR. Esto elimina CORS.
//
// Flujo:
//   Navegador → localhost:3000/api/alojamientos → (servidor Next.js) → alojamientosmr-api.onrender.com
//   Navegador ← datos JSON limpios ← (servidor Next.js) ← respuesta de Render
// ========================================================

const api = axios.create({
  baseURL: '/api',  // Apunta a src/app/api/* (API Routes de Next.js)
  headers: { 'Content-Type': 'application/json' },
  timeout: 180000,
});

// Implementar Retry para 500/504 (Cold Starts/Transient Failures)
axiosRetry(api, { 
  retries: 3, 
  retryDelay: (retryCount) => {
    return retryCount * 3000; // 3s, 6s, 9s
  },
  retryCondition: (error) => {
    // Reintentar si es 500, 502, 503, 504 o error de red
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('alojamiento_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('alojamiento_token');
      localStorage.removeItem('alojamiento_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Para reservas usamos la misma instancia base, las rutas van a /api/reservas
export const reservasApi = api;

export default api;
