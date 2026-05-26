'use client';
import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Search, Check, Clock, XCircle, Eye } from 'lucide-react';
import { reservasApi } from '@/lib/api';
import useApi from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function ReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReserva, setSelectedReserva] = useState(null);

  const fetchAllReservas = async () => {
    setLoading(true);
    try {
      const usersRes = await fetch('/api/usuarios');
      const users = await usersRes.json();
      const validUsers = Array.isArray(users) ? users : [];

      const promises = validUsers.map(u => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        return fetch(`/api/reservas/cliente/${u.usuarioId || u.id}`, { signal: controller.signal })
          .then(res => {
            clearTimeout(timeoutId);
            return res.json();
          })
          .catch(() => {
            clearTimeout(timeoutId);
            return [];
          });
      });

      const results = await Promise.allSettled(promises);
      let todas = [];
      results.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          todas = [...todas, ...res.value];
        }
      });
      setReservas(todas);
    } catch (err) {
      console.error("Client-Side Aggregation falló", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReservas();
  }, []);

  const cambiarEstado = async (reservaId, nuevoEstado) => {
    setReservas(prev => prev.map(r => r.reservaId === reservaId ? { ...r, estado: nuevoEstado } : r));

    toast.success(`Reserva marcada como ${nuevoEstado}`);
    
    try {
      // El PATCH va directamente al backend C#
      await reservasApi.patch(`/reservas/${reservaId}/estado`, { estado: nuevoEstado });
      fetchAllReservas();
    } catch (err) {
      toast.error('Error guardando en la DB. Los cambios se han revertido.');
      fetchAllReservas();
    }
  };

  const getStatusBadge = (estado) => {
    switch ((estado || '').toLowerCase()) {
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
    return new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
    }).format(d);
  };

  const filtered = reservas.filter(r => 
    r.codigo?.toLowerCase().includes(search.toLowerCase()) || 
    r.nombreCliente?.toLowerCase().includes(search.toLowerCase()) ||
    r.propiedadNombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1>Gestión de Reservas</h1>
      </div>

      <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: 360 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Buscar por código, cliente o propiedad..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={48} />
          <h3>No se encontraron reservas</h3>
          <p>La base de datos está vacía o intenta cambiar los términos de búsqueda.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Código / Cliente</th>
                <th>Propiedad</th>
                <th>Fechas</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.reservaId}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>{r.codigo}</div>
                    <div className="text-secondary text-sm">{r.nombreCliente}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.propiedadNombre}</td>
                  <td>
                    <div className="text-sm">
                      <strong>In:</strong> {formatDate(r.fechaCheckIn)}
                    </div>
                    <div className="text-sm text-muted">
                      <strong>Out:</strong> {formatDate(r.fechaCheckOut)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-accent-dark)' }}>
                    ${r.total?.toFixed(2)}
                  </td>
                  <td>{getStatusBadge(r.estado || '')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" title="Ver detalles" onClick={() => setSelectedReserva(r)}><Eye size={15} /></button>
                      
                      {r.estado?.toLowerCase() === 'pendiente' && (
                        <>
                          <button className="btn btn-ghost btn-sm text-success" onClick={() => cambiarEstado(r.reservaId, 'Confirmada')}><Check size={15} /></button>
                          <button className="btn btn-ghost btn-sm text-danger" onClick={() => cambiarEstado(r.reservaId, 'Cancelada')}><XCircle size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReserva && (
        <div className="modal-overlay" onClick={() => setSelectedReserva(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Detalle de Reserva</h3>
                <p className="text-secondary text-sm">Cód. {selectedReserva.codigo}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReserva(null)}><XCircle size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-sm text-secondary">Cliente</div>
                  <div style={{ fontWeight: 600 }}>{selectedReserva.nombreCliente}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">Propiedad</div>
                  <div style={{ fontWeight: 600 }}>{selectedReserva.propiedadNombre}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">Check-In</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedReserva.fechaCheckIn)}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">Check-Out</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedReserva.fechaCheckOut)}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">Estado</div>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedReserva.estado || '')}</div>
                </div>
              </div>

              <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Desglose de Facturación</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span>Subtotal</span>
                  <span>${((selectedReserva.total || 0) / 1.15).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span>Impuestos (15% IVA)</span>
                  <span>${((selectedReserva.total || 0) - ((selectedReserva.total || 0) / 1.15)).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  <span>Total</span>
                  <span>${(selectedReserva.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setSelectedReserva(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
