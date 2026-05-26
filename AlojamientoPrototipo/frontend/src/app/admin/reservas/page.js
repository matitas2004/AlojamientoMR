'use client';
import { XCircle } from 'lucide-react';

export default function ReservasPage() {
  // El backend CQRS (reservasmr-api) no expone un endpoint GET /Reservas global,
  // solo permite GET /Reservas/cliente/{id}
  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1>Gestión de Reservas</h1>
      </div>
      <div className="empty-state" style={{ padding: '6rem 0' }}>
        <XCircle size={64} style={{ opacity: 0.2, margin: '0 auto 1.5rem', color: 'var(--color-danger)' }} />
        <h3>Función no soportada por el Backend</h3>
        <p style={{ maxWidth: 400, margin: '0 auto 2rem' }}>
          La API de Microservicios (CQRS) configurada para las reservas no cuenta con un endpoint para listar todas las reservas globales del sistema. 
          Solo los clientes pueden ver sus propias reservas en el área pública.
        </p>
      </div>
    </div>
  );
}
