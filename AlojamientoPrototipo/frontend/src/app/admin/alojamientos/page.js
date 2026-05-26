'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import useApi from '@/lib/useApi';

const emptyForm = { nombre: '', ciudad: '', direccion: '', descripcion: '', tipoAlojamientoId: 1, socioId: 1, admiteMascotas: false, tienePiscina: false, tieneParqueadero: false };

export default function AlojamientosPage() {
  const { data, mutate, isLoading: loading } = useApi('/alojamientos');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = (Array.isArray(data) ? data : []).filter(a =>
    a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    a.ciudad?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (item) => {
    setForm({
      nombre: item.nombre, ciudad: item.ciudad || '', direccion: item.direccion || '',
      descripcion: item.descripcion || '', tipoAlojamientoId: item.tipoAlojamientoId,
      socioId: item.socioId, admiteMascotas: item.admiteMascotas,
      tienePiscina: item.tienePiscina, tieneParqueadero: item.tieneParqueadero,
    });
    setEditId(item.alojamientoId);
    setShowModal(true);
  };

  // ═══════════════════════════════════════════════════════════
  // OPTIMISTIC UI: Crear / Editar alojamiento
  // ═══════════════════════════════════════════════════════════
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.direccion) { toast.error('Nombre y dirección son obligatorios'); return; }

    // Cerrar modal AL INSTANTE
    setShowModal(false);

    if (editId) {
      // OPTIMISTIC EDIT: Actualizar la fila en tabla al instante
      toast.success('Alojamiento actualizado ✓');
      mutate((prev) => (prev || []).map(a =>
        a.alojamientoId === editId ? { ...a, ...form } : a
      ), { revalidate: false });

      // Enviar a API en background
      try { await api.put(`/alojamientos/${editId}`, form); mutate(); }
      catch (err) {
        toast.error('Error al actualizar en la BD. Revertiendo.');
        mutate(); // Rollback
      }
    } else {
      // OPTIMISTIC CREATE: Dibujar nuevo registro al instante
      const nuevoMock = {
        ...form,
        alojamientoId: Date.now(),
        estado: 'Pendiente',
        _optimistic: true,
      };
      toast.success('Alojamiento creado ✓');
      mutate((prev) => [...(prev || []), nuevoMock], { revalidate: false });

      // Enviar a API en background
      try { await api.post('/alojamientos', form); mutate(); }
      catch (err) {
        toast.error('Error al crear en la BD. Revertiendo.');
        mutate(); // Rollback
      }
    }
  };

  // ═══════════════════════════════════════════════════════════
  // OPTIMISTIC UI: Eliminar alojamiento
  // ═══════════════════════════════════════════════════════════
  const handleDelete = async () => {
    const idToDelete = deleteId;
    setDeleteId(null);
    toast.success('Alojamiento eliminado ✓');

    // Quitar de tabla AL INSTANTE
    mutate((prev) => (prev || []).filter(a => a.alojamientoId !== idToDelete), { revalidate: false });

    try { await api.delete(`/alojamientos/${idToDelete}`); mutate(); }
    catch (err) {
      toast.error('Error al eliminar en la BD. Revertiendo.');
      mutate(); // Rollback
    }
  };

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1>Gestión de Alojamientos</h1>
        <button className="btn btn-accent" onClick={openCreate}><Plus size={18} /> Nuevo Alojamiento</button>
      </div>

      <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: 360 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Buscar por nombre o ciudad..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>Sin alojamientos</h3>
          <p>Crea tu primer alojamiento con el botón de arriba</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Ciudad</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.alojamientoId} style={item._optimistic ? { opacity: 0.7 } : {}}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>#{item.alojamientoId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                    <div className="text-muted text-sm">{item.direccion}</div>
                  </td>
                  <td>{item.ciudad || '—'}</td>
                  <td><span className={`badge ${item.estado === 'Activo' ? 'badge-success' : 'badge-warning'}`}>{item.estado || 'Pendiente'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Pencil size={15} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteId(item.alojamientoId)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Alojamiento' : 'Nuevo Alojamiento'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Nombre *</label>
                    <input className="input-field" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Hotel Paraíso" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Ciudad</label>
                    <input className="input-field" value={form.ciudad} onChange={(e) => setForm({...form, ciudad: e.target.value})} placeholder="Quito" />
                  </div>
                  <div className="input-group full-width">
                    <label className="input-label">Dirección *</label>
                    <input className="input-field" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} placeholder="Av. Principal 123" />
                  </div>
                  <div className="input-group full-width">
                    <label className="input-label">Descripción</label>
                    <textarea className="input-field" rows={3} value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} placeholder="Describe el alojamiento..." />
                  </div>
                  <div className="toggle-wrapper">
                    <button type="button" className={`toggle ${form.admiteMascotas ? 'active' : ''}`} onClick={() => setForm({...form, admiteMascotas: !form.admiteMascotas})} />
                    <span className="text-sm">Mascotas</span>
                  </div>
                  <div className="toggle-wrapper">
                    <button type="button" className={`toggle ${form.tienePiscina ? 'active' : ''}`} onClick={() => setForm({...form, tienePiscina: !form.tienePiscina})} />
                    <span className="text-sm">Piscina</span>
                  </div>
                  <div className="toggle-wrapper">
                    <button type="button" className={`toggle ${form.tieneParqueadero ? 'active' : ''}`} onClick={() => setForm({...form, tieneParqueadero: !form.tieneParqueadero})} />
                    <span className="text-sm">Parqueadero</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Guardar Cambios' : 'Crear Alojamiento'}
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
              <h3 style={{ marginBottom: '0.5rem' }}>¿Eliminar alojamiento?</h3>
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
