'use client';
import { useState } from 'react';
import { Plus, Trash2, BedDouble, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import useApi from '@/lib/useApi';

const emptyHab = { alojamientoId: 0, nombre: '', descripcion: '', capacidadAdultos: 2, capacidadNinos: 0, numBanos: 1, numDormitorios: 1, tieneCocina: false, tieneAireAcondicionado: false, superficieM2: null, precioNoche: 0 };

export default function HabitacionesPage() {
  const { data: alojamientosRaw } = useApi('/alojamientos');
  const alojamientos = Array.isArray(alojamientosRaw) ? alojamientosRaw : [];
  
  const [selectedId, setSelectedId] = useState('');
  const { data: habitacionesRaw, mutate: mutateHabs, isLoading: loading } = useApi(
    selectedId ? `/habitaciones/alojamiento/${selectedId}` : null
  );
  const habitaciones = Array.isArray(habitacionesRaw) ? habitacionesRaw : [];
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyHab);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openCreate = () => {
    setForm({ ...emptyHab, alojamientoId: parseInt(selectedId) });
    setShowModal(true);
  };

  // ═══════════════════════════════════════════════════════════
  // OPTIMISTIC UI: Crear habitación
  // Cierra el modal al instante, dibuja en tabla, luego envía a API en background
  // ═══════════════════════════════════════════════════════════
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre) { toast.error('El nombre es obligatorio'); return; }

    const nuevaHab = {
      ...form,
      habitacionId: Date.now(), // ID temporal único
      precioNoche: parseFloat(form.precioNoche) || 0,
      superficieM2: form.superficieM2 ? parseFloat(form.superficieM2) : null,
      _optimistic: true, // Marcador interno
    };

    // 1. Cerrar modal AL INSTANTE
    setShowModal(false);
    toast.success('Habitación creada ✓');

    // 2. Dibujar en tabla AL INSTANTE (Optimistic Update)
    mutateHabs((prev) => [...(prev || []), nuevaHab], { revalidate: false });

    // 3. Enviar a API en segundo plano (Fire-and-Forget con reintento silencioso)
    try {
      await api.post('/habitaciones', {
        ...form,
        precioNoche: parseFloat(form.precioNoche) || 0,
        superficieM2: form.superficieM2 ? parseFloat(form.superficieM2) : null,
      });
      mutateHabs(); // Sincronización real con BD
    } catch (err) {
      toast.error('Error al guardar en BD. Revertiendo cambios.');
      mutateHabs(); // Rollback (borra la UI optimista fallida)
    }
  };

  // ═══════════════════════════════════════════════════════════
  // OPTIMISTIC UI: Eliminar habitación
  // ═══════════════════════════════════════════════════════════
  const handleDelete = async () => {
    const idToDelete = deleteId;
    setDeleteId(null);
    toast.success('Habitación eliminada ✓');

    // Quitar de la tabla AL INSTANTE
    mutateHabs((prev) => (prev || []).filter(h => h.habitacionId !== idToDelete), { revalidate: false });

    // Enviar a API en segundo plano
    try {
      await api.delete(`/habitaciones/${idToDelete}`);
      mutateHabs();
    } catch (err) {
      toast.error('Error al eliminar en la BD. Revertiendo.');
      mutateHabs(); // Rollback
    }
  };

  const selectedName = alojamientos.find(a => a.alojamientoId === parseInt(selectedId))?.nombre;

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1>Gestión de Habitaciones</h1>
        {selectedId && <button className="btn btn-accent" onClick={openCreate}><Plus size={18} /> Nueva Habitación</button>}
      </div>

      <div className="card card-static" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div className="input-group">
          <label className="input-label">Selecciona un Alojamiento</label>
          <select className="input-field" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">— Elige un alojamiento —</option>
            {alojamientos.map(a => (
              <option key={a.alojamientoId} value={a.alojamientoId}>{a.nombre} ({a.ciudad || 'Sin ciudad'})</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedId ? (
        <div className="empty-state">
          <BedDouble size={48} />
          <h3>Selecciona un alojamiento</h3>
          <p>Elige un alojamiento del menú de arriba para gestionar sus habitaciones</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : habitaciones.length === 0 ? (
        <div className="empty-state">
          <BedDouble size={48} />
          <h3>Sin habitaciones</h3>
          <p>{selectedName} aún no tiene habitaciones registradas</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Capacidad</th><th>Precio/Noche</th><th>Baños</th><th>Amenidades</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {habitaciones.map(h => (
                <tr key={h.habitacionId} style={h._optimistic ? { opacity: 0.7 } : {}}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>#{h.habitacionId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{h.nombre}</div>
                    {h.descripcion && <div className="text-muted text-sm">{h.descripcion}</div>}
                  </td>
                  <td>
                    <span className="badge badge-primary">{h.capacidadAdultos} adultos</span>
                    {h.capacidadNinos > 0 && <span className="badge badge-neutral" style={{ marginLeft: 4 }}>{h.capacidadNinos} niños</span>}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-accent-dark)' }}>${h.precioNoche?.toFixed(2)}</td>
                  <td>{h.numBanos}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {h.tieneAireAcondicionado && <span className="badge badge-neutral">A/C</span>}
                      {h.tieneCocina && <span className="badge badge-neutral">Cocina</span>}
                      {h.superficieM2 && <span className="badge badge-neutral">{h.superficieM2}m²</span>}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteId(h.habitacionId)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Habitación</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label className="input-label">Nombre *</label>
                    <input className="input-field" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Habitación Doble" />
                  </div>
                  <div className="input-group full-width">
                    <label className="input-label">Descripción</label>
                    <textarea className="input-field" rows={2} value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} placeholder="Habitación cómoda con vista..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Precio/Noche ($) *</label>
                    <input className="input-field" type="number" step="0.01" min="0" value={form.precioNoche} onChange={(e) => setForm({...form, precioNoche: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Superficie (m²)</label>
                    <input className="input-field" type="number" step="0.01" value={form.superficieM2 || ''} onChange={(e) => setForm({...form, superficieM2: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Adultos</label>
                    <input className="input-field" type="number" min="1" value={form.capacidadAdultos} onChange={(e) => setForm({...form, capacidadAdultos: parseInt(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Niños</label>
                    <input className="input-field" type="number" min="0" value={form.capacidadNinos} onChange={(e) => setForm({...form, capacidadNinos: parseInt(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Baños</label>
                    <input className="input-field" type="number" min="1" value={form.numBanos} onChange={(e) => setForm({...form, numBanos: parseInt(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Dormitorios</label>
                    <input className="input-field" type="number" min="1" value={form.numDormitorios} onChange={(e) => setForm({...form, numDormitorios: parseInt(e.target.value)})} />
                  </div>
                  <div className="toggle-wrapper">
                    <button type="button" className={`toggle ${form.tieneAireAcondicionado ? 'active' : ''}`} onClick={() => setForm({...form, tieneAireAcondicionado: !form.tieneAireAcondicionado})} />
                    <span className="text-sm">Aire Acondicionado</span>
                  </div>
                  <div className="toggle-wrapper">
                    <button type="button" className={`toggle ${form.tieneCocina ? 'active' : ''}`} onClick={() => setForm({...form, tieneCocina: !form.tieneCocina})} />
                    <span className="text-sm">Cocina</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  Crear Habitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <Trash2 size={40} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>¿Eliminar habitación?</h3>
              <p className="text-secondary text-sm">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
