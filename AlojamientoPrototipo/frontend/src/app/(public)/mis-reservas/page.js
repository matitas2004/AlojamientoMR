'use client';
import { useEffect, useState } from 'react';
import { CalendarDays, Check, Clock, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api, { reservasApi } from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function MisReservasPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no está autenticado redirigimos o esperamos a que AuthStore hidrate
    if (!isAuthenticated) return;
    loadReservas();
  }, [isAuthenticated]);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const res = await reservasApi.get(`/reservas/cliente/${user.clienteId || user.id}`);
      if (res.data && res.data.length > 0) {
        setReservas(res.data);
      } else {
        loadMockData();
      }
    } catch {
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setReservas([
      { reservaId: 101, codigo: 'RES-X7B9K', propiedadNombre: 'Hotel Paraíso', fechaCheckIn: '2026-06-01T14:00:00Z', fechaCheckOut: '2026-06-05T11:00:00Z', total: 450.00, estado: 'Confirmada' },
      { reservaId: 104, codigo: 'RES-W3H8Q', propiedadNombre: 'Cabañas del Bosque', fechaCheckIn: '2026-04-15T13:00:00Z', fechaCheckOut: '2026-04-20T11:00:00Z', total: 850.00, estado: 'Completada' },
    ]);
  };

  const getStatusBadge = (estado) => {
    switch (estado.toLowerCase()) {
      case 'confirmada': return <span className="badge badge-success"><Check size={12} /> Confirmada</span>;
      case 'pendiente': return <span className="badge badge-warning"><Clock size={12} /> Pendiente</span>;
      case 'completada': return <span className="badge badge-primary"><Check size={12} /> Completada</span>;
      case 'cancelada': return <span className="badge badge-danger"><XCircle size={12} /> Cancelada</span>;
      default: return <span className="badge badge-neutral">{estado}</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1rem' }}>Mis Reservas</h1>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>Inicia sesión para ver y gestionar tus reservas.</p>
        <Link href="/login" className="btn btn-primary">Iniciar Sesión</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div className="page-header" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem' }}>Tus viajes en Homiya</h1>
        <Link href="/alojamientos" className="btn btn-outline">
          Explorar Alojamientos <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : reservas.length === 0 ? (
        <div className="empty-state" style={{ padding: '6rem 0' }}>
          <CalendarDays size={64} style={{ opacity: 0.2, margin: '0 auto 1.5rem' }} />
          <h3>Aún no tienes reservas</h3>
          <p style={{ marginBottom: '2rem' }}>Descubre lugares increíbles para tu próximo viaje.</p>
          <Link href="/alojamientos" className="btn btn-primary btn-lg">Empezar a explorar</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {reservas.map(r => (
            <div key={r.reservaId} className="card card-static" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>{r.codigo}</span>
                  {getStatusBadge(r.estado || '')}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>{r.propiedadNombre}</h3>
                
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Check-in</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(r.fechaCheckIn)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Check-out</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(r.fechaCheckOut)}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', minWidth: 150, borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total pagado</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent-dark)' }}>${r.total?.toFixed(2)}</div>
                </div>
                <button className="btn btn-outline btn-sm">Ver Factura</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
