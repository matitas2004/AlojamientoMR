'use client';
import { useState, useMemo, useCallback, useRef } from 'react';
import { CalendarDays, Search, Check, Clock, XCircle, Eye, RefreshCw } from 'lucide-react';
import { reservasApi } from '@/lib/api';
import useApi from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function ReservasPage() {
  // ✅ CORRECCIÓN: Usamos useApi/SWR en lugar de fetch manual + useState
  // Esto asegura que mutate() actualice la lista instantáneamente
  const { data: reservasRaw, isLoading: loading, mutate } = useApi('/reservas', { fallbackData: [] });
  const reservas = Array.isArray(reservasRaw) ? reservasRaw : [];

  const [search, setSearch] = useState('');
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [changing, setChanging] = useState(null); // ID de reserva cambiando estado

  // ═══════════════════════════════════════════════════════════
  // OPTIMISTIC UI: Cambiar estado de reserva
  // Actualiza la fila al instante, luego confirma con el backend
  // ═══════════════════════════════════════════════════════════
  const cambiarEstado = useCallback(async (reservaId, nuevoEstado) => {
    setChanging(reservaId);

    // 1. Actualizar la lista localmente AL INSTANTE
    mutate(
      (prev) => (prev || []).map(r =>
        r.reservaId === reservaId ? { ...r, estado: nuevoEstado } : r
      ),
      { revalidate: false }
    );

    // Cerrar el detalle si estaba abierto
    setSelectedReserva(prev => prev?.reservaId === reservaId ? { ...prev, estado: nuevoEstado } : prev);

    toast.success(`Reserva marcada como ${nuevoEstado}`);

    try {
      await reservasApi.patch(`/reservas/${reservaId}/estado`, { estado: nuevoEstado });
      // Revalidar desde el servidor para confirmar
      mutate();
    } catch (err) {
      toast.error('Error al guardar en la BD. Revertiendo cambios.');
      mutate(); // Rollback: recarga datos reales del servidor
    } finally {
      setChanging(null);
    }
  }, [mutate]);

  const getStatusBadge = (estado) => {
    switch ((estado || '').toLowerCase()) {
      case 'confirmada': return <span className="badge badge-success"><Check size={12} /> Confirmada</span>;
      case 'pendiente':  return <span className="badge badge-warning"><Clock size={12} /> Pendiente</span>;
      case 'completada': return <span className="badge badge-primary"><Check size={12} /> Completada</span>;
      case 'cancelada':  return <span className="badge badge-danger"><XCircle size={12} /> Cancelada</span>;
      default:           return <span className="badge badge-neutral">{estado || '—'}</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(isoString));
  };

  const filtered = useMemo(() => reservas.filter(r => {
    const q = search.toLowerCase();
    const cod = (r.codigoReserva || r.codigo || '').toLowerCase();
    const cli = (r.nombreCliente || `cliente ${r.clienteId}`).toLowerCase();
    const prop = (r.propiedadNombre || `alojamiento ${r.alojamientoId}`).toLowerCase();
    return cod.includes(q) || cli.includes(q) || prop.includes(q);
  }), [reservas, search]);

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1>Gestión de Reservas</h1>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => mutate()}
          title="Recargar desde el servidor"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: 360 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          className="input-field"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Buscar por código, cliente o propiedad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => mutate()}>
            <RefreshCw size={16} /> Reintentar
          </button>
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
              {filtered.map(r => {
                const isChanging = changing === r.reservaId;
                return (
                  <tr key={r.reservaId} style={isChanging ? { opacity: 0.7 } : {}}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                        {r.codigoReserva || r.codigo || `#${r.reservaId}`}
                      </div>
                      <div className="text-secondary text-sm">{r.nombreCliente || `Cliente #${r.clienteId}`}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.propiedadNombre || `Alojamiento #${r.alojamientoId}`}</td>
                    <td>
                      <div className="text-sm"><strong>In:</strong> {formatDate(r.fechaCheckIn)}</div>
                      <div className="text-sm text-muted"><strong>Out:</strong> {formatDate(r.fechaCheckOut)}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-accent-dark)' }}>
                      ${(r.total || 0).toFixed(2)}
                    </td>
                    <td>{getStatusBadge(r.estado)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Ver detalles"
                          onClick={() => setSelectedReserva(r)}
                        >
                          <Eye size={15} />
                        </button>

                        {(r.estado || '').toLowerCase() === 'pendiente' && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm text-success"
                              title="Confirmar"
                              disabled={isChanging}
                              onClick={() => cambiarEstado(r.reservaId, 'Confirmada')}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm text-danger"
                              title="Cancelar"
                              disabled={isChanging}
                              onClick={() => cambiarEstado(r.reservaId, 'Cancelada')}
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedReserva && (
        <div className="modal-overlay" onClick={() => setSelectedReserva(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Detalle de Reserva</h3>
                <p className="text-secondary text-sm">Cód. {selectedReserva.codigoReserva || selectedReserva.codigo || `#${selectedReserva.reservaId}`}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReserva(null)}><XCircle size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div className="text-sm text-secondary">Cliente</div>
                  <div style={{ fontWeight: 600 }}>{selectedReserva.nombreCliente || `#${selectedReserva.clienteId}`}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">Propiedad</div>
                  <div style={{ fontWeight: 600 }}>{selectedReserva.propiedadNombre || `#${selectedReserva.alojamientoId}`}</div>
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
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedReserva.estado)}</div>
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
                  <span>${((selectedReserva.total || 0) - (selectedReserva.total || 0) / 1.15).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  <span>Total</span>
                  <span>${(selectedReserva.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Acciones dentro del modal */}
              {(selectedReserva.estado || '').toLowerCase() === 'pendiente' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={changing === selectedReserva.reservaId}
                    onClick={() => cambiarEstado(selectedReserva.reservaId, 'Confirmada')}
                  >
                    <Check size={16} /> Confirmar Reserva
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    disabled={changing === selectedReserva.reservaId}
                    onClick={() => cambiarEstado(selectedReserva.reservaId, 'Cancelada')}
                  >
                    <XCircle size={16} /> Cancelar
                  </button>
                </div>
              )}
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
