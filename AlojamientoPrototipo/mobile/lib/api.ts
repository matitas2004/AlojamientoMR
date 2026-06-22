import axios from 'axios';
import axiosRetry from 'axios-retry';

// ─── URLs de los Microservicios en Render ───────────────────────────────────
const BASE_ALOJAMIENTOS = 'https://alojamientosmr-api.onrender.com/api/v1';
const BASE_RESERVAS     = 'https://reservasmr-api.onrender.com/api/v1';
const BASE_USUARIOS     = 'https://usuariosmr-api.onrender.com/api/v1';
const BASE_FACTURACION  = 'https://facturacionmr-api.onrender.com/api/v1';

// ─── Instancias de Axios para cada Microservicio ─────────────────────────────
export const alojamientosApi = axios.create({
  baseURL: BASE_ALOJAMIENTOS,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

export const reservasApi = axios.create({
  baseURL: BASE_RESERVAS,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

export const usuariosApi = axios.create({
  baseURL: BASE_USUARIOS,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

export const facturacionApi = axios.create({
  baseURL: BASE_FACTURACION,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Sincronizar Token de Autorización ──────────────────────────────────────
export function setAuthToken(token: string | null) {
  const apis = [alojamientosApi, reservasApi, usuariosApi, facturacionApi];
  apis.forEach(apiInstance => {
    if (token) {
      apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiInstance.defaults.headers.common['Authorization'];
    }
  });
}

// ─── Configurar Retry para cada Instancia ────────────────────────────────────
const setupRetry = (apiInstance: any) => {
  axiosRetry(apiInstance, {
    retries: 4,
    retryDelay: (retryCount) => {
      return retryCount * 3000; // 3s, 6s, 9s, 12s
    },
    retryCondition: (error) => {
      // Reintentar si es error de red (e.g. timeout) o status 500+
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
             (error.response && error.response.status >= 500);
    }
  });
};

[alojamientosApi, reservasApi, usuariosApi, facturacionApi].forEach(setupRetry);

// ─── Interceptor de Errores Global (Cold Start / Caídas) ─────────────────────
const setupInterceptors = (apiInstance: any) => {
  apiInstance.interceptors.response.use(
    (res: any) => res,
    (err: any) => {
      const status = err?.response?.status;
      if (!status) {
        err.friendlyMessage = 'Sin conexión al servidor. Si es la primera vez en minutos, los servidores de Render están despertando del modo reposo (toma ~50 segundos).';
      } else if (status === 401) {
        err.friendlyMessage = 'Sesión expirada o credenciales incorrectas. Por favor inicia sesión de nuevo.';
      } else if (status >= 500) {
        err.friendlyMessage = 'El servidor de Render está iniciando, intenta en unos segundos.';
      }
      return Promise.reject(err);
    }
  );
};

[alojamientosApi, reservasApi, usuariosApi, facturacionApi].forEach(setupInterceptors);

// ─── Endpoints de Alto Nivel para las Pantallas ─────────────────────────────
// Retornamos el Axios Promise completo para que coincida con lo que las pantallas esperan (.data)
export const Auth = {
  login: (email, password) =>
    usuariosApi.post('/auth/login', { email, password }),

  register: (data) =>
    usuariosApi.post('/clientes/registrar', data),
};

export const Alojamientos = {
  getAll: () =>
    alojamientosApi.get('/alojamientos'),

  getById: (id) =>
    alojamientosApi.get(`/alojamientos/${id}`),

  getHabitaciones: (alojamientoId) =>
    alojamientosApi.get(`/habitaciones/alojamiento/${alojamientoId}`),
};

export const Reservas = {
  getMisReservas: (clienteId) =>
    reservasApi.get(`/Reservas/cliente/${clienteId}`),

  crear: (data) =>
    reservasApi.post('/Reservas', data),
};

export const Facturas = {
  getByReserva: (reservaId) =>
    facturacionApi.get(`/Facturas/reserva/${reservaId}`),

  crear: (data) =>
    facturacionApi.post('/Facturas', data),
};

export default {
  Auth,
  Alojamientos,
  Reservas,
  Facturas,
  setAuthToken,
};
