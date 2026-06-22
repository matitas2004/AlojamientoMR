import axios from 'axios';

// ══════════════════════════════════════════════════════════════
// API Client — Conexión directa a las APIs de Render
// La app móvil NO usa proxy (BFF). Llama directamente a Render.
// ══════════════════════════════════════════════════════════════

const BASE_ALOJAMIENTOS = 'https://alojamientosmr-api.onrender.com/api/v1';
const BASE_RESERVAS     = 'https://reservasmr-api.onrender.com/api/v1';
const BASE_USUARIOS     = 'https://usuariosmr-api.onrender.com/api/v1';
const BASE_FACTURACION  = 'https://facturacionmr-api.onrender.com/api/v1';

// ── Instancia para Alojamientos ──
export const alojamientosApi = axios.create({
  baseURL: BASE_ALOJAMIENTOS,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Instancia para Reservas ──
export const reservasApi = axios.create({
  baseURL: BASE_RESERVAS,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Instancia para Usuarios / Auth ──
export const usuariosApi = axios.create({
  baseURL: BASE_USUARIOS,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Instancia para Facturación ──
export const facturacionApi = axios.create({
  baseURL: BASE_FACTURACION,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Retry con backoff exponencial (resiliencia) ──
const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.response?.status;
      if (i === retries - 1) throw err;
      if (status && status < 500) throw err; // No reintentar errores del cliente
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries reached');
};

// ── API de alto nivel con resiliencia incorporada ──
export const api = {
  // Alojamientos
  getAlojamientos: () => withRetry(() => alojamientosApi.get('/alojamientos').then(r => r.data?.value || r.data || [])),
  getAlojamiento: (id: number) => withRetry(() => alojamientosApi.get(`/alojamientos/${id}`).then(r => r.data)),
  getHabitaciones: (alojamientoId: number) => withRetry(() => alojamientosApi.get(`/habitaciones/alojamiento/${alojamientoId}`).then(r => r.data?.value || r.data || [])),

  // Reservas
  getReservas: () => withRetry(() => reservasApi.get('/Reservas').then(r => r.data?.value || r.data || [])),
  getReservasByCliente: (clienteId: number) => withRetry(() => reservasApi.get(`/Reservas/cliente/${clienteId}`).then(r => r.data?.value || r.data || [])),
  crearReserva: (body: any) => withRetry(() => reservasApi.post('/Reservas', body).then(r => r.data)),

  // Auth
  login: (email: string, password: string) => usuariosApi.post('/auth/login', { email, password }).then(r => r.data),
  register: (body: any) => usuariosApi.post('/clientes/registrar', body).then(r => r.data), // Ajustar al endpoint real si existe

  // Facturación
  getFacturaByReservaId: (reservaId: number) => withRetry(() => facturacionApi.get(`/Facturas/reserva/${reservaId}`).then(r => r.data)),
  crearFactura: (body: any) => withRetry(() => facturacionApi.post('/Facturas', body).then(r => r.data)),

  // Wakeup (despertar todos los servicios en paralelo)
  wakeup: () => Promise.allSettled([
    alojamientosApi.get('/alojamientos').catch(() => null),
    reservasApi.get('/Reservas').catch(() => null),
    usuariosApi.get('/usuarios').catch(() => null),
  ]),
};

export default api;
