'use client';
import { useEffect } from 'react';

export default function WakeupPing() {
  useEffect(() => {
    // Ping al endpoint de wakeup sin esperar respuesta, solo para despertar los servicios.
    fetch('/api/wakeup').catch(() => {});
  }, []);
  return null;
}
