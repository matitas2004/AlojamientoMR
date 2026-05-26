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
      dedupingInterval: 10000,        // Deduplicar peticiones iguales en 10s
      errorRetryCount: 2,             // Solo reintentar 2 veces
      errorRetryInterval: 3000,       // Esperar 3s entre reintentos
      keepPreviousData: true,         // Mantener datos antiguos mientras carga nuevos
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
