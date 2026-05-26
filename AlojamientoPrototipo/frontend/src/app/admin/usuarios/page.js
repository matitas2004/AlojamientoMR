'use client';
import { useState } from 'react';
import { Search, Users, Shield, User, X, Check, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Datos de prueba temporales hasta tener la API real de usuarios desplegada
const mockUsers = [
  { usuarioId: 1, nombreCompleto: 'Mathias Rivera', email: 'admin@alojamiento.com', rol: 'Administrador', estado: true },
  { usuarioId: 2, nombreCompleto: 'Carlos López', email: 'colaborador@alojamiento.com', rol: 'Colaborador', estado: true },
  { usuarioId: 3, nombreCompleto: 'Ana Martínez', email: 'ana@cliente.com', rol: 'Cliente', estado: true },
  { usuarioId: 4, nombreCompleto: 'Pedro Sánchez', email: 'pedro@colaborador.com', rol: 'Colaborador', estado: false },
];

export default function UsuariosPage() {
  const [data, setData] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = data.filter(u =>
    u.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.rol.toLowerCase().includes(search.toLowerCase())
  );

  const toggleEstado = async (user) => {
    // Simular llamada a API
    const promise = new Promise(resolve => setTimeout(resolve, 500));
    toast.promise(promise, {
      loading: 'Actualizando estado...',
      success: `Estado de ${user.nombreCompleto} actualizado`,
      error: 'Error al actualizar',
    });
    
    await promise;
    setData(data.map(u => u.usuarioId === user.usuarioId ? { ...u, estado: !u.estado } : u));
  };

  const openRoleChange = (user) => {
    setSelectedUser({ ...user });
    setShowRoleModal(true);
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setData(data.map(u => u.usuarioId === selectedUser.usuarioId ? selectedUser : u));
    toast.success(`Rol de ${selectedUser.nombreCompleto} actualizado a ${selectedUser.rol}`);
    setSaving(false);
    setShowRoleModal(false);
  };

  const getRoleIcon = (rol) => {
    switch(rol.toLowerCase()) {
      case 'administrador': return <Shield size={14} className="text-accent" />;
      case 'colaborador': return <Building2 size={14} className="text-primary-light" />;
      default: return <User size={14} className="text-secondary" />;
    }
  };

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p className="text-secondary text-sm">Administra los roles y accesos de la plataforma</p>
      </div>

      <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: 360 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Buscar por nombre, correo o rol..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.usuarioId} style={{ opacity: user.estado ? 1 : 0.6 }}>
                <td>
                  <div style={{ fontWeight: 600 }}>{user.nombreCompleto}</div>
                  <div className="text-muted text-sm">{user.email}</div>
                </td>
                <td>
                  <span className={`badge ${user.rol.toLowerCase() === 'administrador' ? 'badge-primary' : user.rol.toLowerCase() === 'colaborador' ? 'badge-success' : 'badge-neutral'}`}>
                    {user.rol}
                  </span>
                </td>
                <td>
                  {user.estado ? (
                    <span className="badge badge-success"><Check size={12} /> Activo</span>
                  ) : (
                    <span className="badge badge-danger"><XCircle size={12} /> Inactivo</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openRoleChange(user)}>Cambiar Rol</button>
                    <button 
                      className={`btn btn-sm ${user.estado ? 'btn-ghost' : 'btn-primary'}`} 
                      onClick={() => toggleEstado(user)}
                    >
                      {user.estado ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modificar Rol</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRoleModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRoleChange}>
              <div className="modal-body">
                <p className="text-secondary mb-4">Selecciona el nuevo rol para <strong>{selectedUser.nombreCompleto}</strong>.</p>
                <div className="input-group">
                  <label className="input-label">Rol del sistema</label>
                  <select 
                    className="input-field" 
                    value={selectedUser.rol} 
                    onChange={(e) => setSelectedUser({...selectedUser, rol: e.target.value})}
                  >
                    <option value="Cliente">Cliente</option>
                    <option value="Colaborador">Colaborador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <div className="spinner" /> : null}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Dummy import para no quebrar el render, ya que Building2 no estaba en la lista de imports principales de lucide en este archivo
import { Building2 } from 'lucide-react';
