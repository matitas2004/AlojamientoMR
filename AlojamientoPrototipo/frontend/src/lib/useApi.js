'use client';
import useSWR from 'swr';
import api from './api';

/**
 * Hook universal con SWR: Caché instantáneo + revalidación en segundo plano.
 * 
 * @param {string} url - Ruta relativa de la API (ej: '/alojamientos')
 * @param {object} options - Opciones extra de SWR
 * @returns {{ data, error, isLoading, mutate }}
 */
const fetcher = (url) => api.get(url).then(res => {
  const d = res.data;
  // Normalizar: si viene como { value: [...] }, extraer el array
  if (d && typeof d === 'object' && !Array.isArray(d) && d.value) {
    return d.value;
  }
  return d;
});

export default function useApi(url, options = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,       // No recargar al volver a la pestaña
      dedupingInterval: 2000,         // Deduplicar peticiones iguales en 2s (era 10s)
      errorRetryCount: 3,             // Reintentar 3 veces (para cold starts de Render)
      errorRetryInterval: 2000,       // Esperar 2s entre reintentos
      keepPreviousData: true,         // Mantener datos antiguos mientras carga nuevos
      refreshInterval: 0,             // Sin polling automático
      ...options,
    }
  );

  return {
    data: data ?? (options.fallbackData || []),
    error,
    isLoading,
    mutate,
  };
}
