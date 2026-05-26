'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Waves, Car, PawPrint, Star, BedDouble, Users, Wind, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { reservasApi } from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import styles from './detalle.module.css';

export default function PropiedadDetallePage({ params }) {
  // En Next 15+ usamos React.use() para destapar params asíncronos si es necesario, 
  // pero para pages cliente-first suele venir ya resuelto, aunque la documentación dice que es una promesa.
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [propiedad, setPropiedad] = useState(null);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    habitacionIds: [],
    fechaCheckIn: '',
    fechaCheckOut: '',
    numAdultos: 2,
    numNinos: 0,
    llevaMascotas: false
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]); // Fechas ocupadas
  const [fechaError, setFechaError] = useState(''); // Mensaje de error de fecha

  // Fecha mínima: hoy (no permitir fechas pasadas)
  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [propRes, habRes] = await Promise.all([
        api.get(`/alojamientos/${id}`),
        api.get(`/habitaciones/alojamiento/${id}`)
      ]);
      setPropiedad(propRes.data);
      const habArray = Array.isArray(habRes.data) ? habRes.data : [];
      setHabitaciones(habArray);
      
      // Auto-seleccionar primera habitación si hay
      if (habArray.length > 0) {
        setForm(prev => ({ ...prev, habitacionIds: [habArray[0].habitacionId] }));
      }
    } catch (error) {
      toast.error('Error al cargar la información del servidor. Inténtalo de nuevo.');
      console.error("Error cargando alojamiento:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitacion = (habId) => {
    setForm(prev => {
      const isSelected = prev.habitacionIds.includes(habId);
      let newIds;
      if (isSelected) {
        if (prev.habitacionIds.length === 1) return prev;
        newIds = prev.habitacionIds.filter(i => i !== habId);
      } else {
        newIds = [...prev.habitacionIds, habId];
      }
      // Re-validar disponibilidad al cambiar habitaciones
      checkDisponibilidad(newIds, prev.fechaCheckIn, prev.fechaCheckOut);
      return { ...prev, habitacionIds: newIds };
    });
  };

  // Consultar el calendario de disponibilidad de las habitaciones seleccionadas
  const checkDisponibilidad = async (habIds, checkIn, checkOut) => {
    if (!habIds.length || !checkIn || !checkOut) {
      setFechaError('');
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Validación básica: check-out debe ser posterior a check-in
    if (end <= start) {
      setFechaError('La fecha de Check-out debe ser posterior a la de Check-in.');
      return;
    }

    // Validación: no permitir fechas pasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      setFechaError('No puedes reservar en una fecha que ya pasó.');
      return;
    }

    try {
      // Obtener los meses que abarca la reserva
      const meses = new Set();
      const cursor = new Date(start);
      while (cursor <= end) {
        meses.add(`${cursor.getFullYear()}-${cursor.getMonth() + 1}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }

      // Consultar el calendario de cada habitación seleccionada para cada mes
      const allBlocked = [];
      for (const habId of habIds) {
        for (const mesAnio of meses) {
          const [anio, mes] = mesAnio.split('-');
          try {
            const res = await api.get(`/calendario/habitacion/${habId}?mes=${mes}&anio=${anio}`);
            const data = Array.isArray(res.data) ? res.data : [];
            data.forEach(d => {
              if (d.fecha) allBlocked.push(d.fecha.split('T')[0]);
            });
          } catch { /* endpoint puede no existir aún, silenciar */ }
        }
      }

      setFechasBloqueadas(allBlocked);

      // Verificar si algún día de la estadía choca con las fechas bloqueadas
      const conflicto = [];
      const day = new Date(start);
      while (day < end) {
        const dayStr = day.toISOString().split('T')[0];
        if (allBlocked.includes(dayStr)) {
          conflicto.push(dayStr);
        }
        day.setDate(day.getDate() + 1);
      }

      if (conflicto.length > 0) {
        setFechaError(`Las habitaciones seleccionadas no están disponibles del ${conflicto[0]} al ${conflicto[conflicto.length - 1]}. Por favor elige otras fechas.`);
      } else {
        setFechaError('');
      }
    } catch (err) {
      console.warn('Error verificando calendario:', err);
      setFechaError('');
    }
  };

  // Handler para cambios de fecha que dispara la validación
  const handleFechaChange = (field, value) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    checkDisponibilidad(newForm.habitacionIds, newForm.fechaCheckIn, newForm.fechaCheckOut);
  };

  // Calcular totales
  const selectedRooms = habitaciones.filter(h => form.habitacionIds.includes(h.habitacionId));
  const pricePerNight = selectedRooms.reduce((sum, h) => sum + (h.precioNoche || 0), 0);
  
  let nights = 0;
  if (form.fechaCheckIn && form.fechaCheckOut) {
    const start = new Date(form.fechaCheckIn);
    const end = new Date(form.fechaCheckOut);
    nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }
  const subtotal = pricePerNight * (nights || 1);
  const taxes = subtotal * 0.15; // 15% IVA
  const total = subtotal + taxes;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast('Por favor inicia sesión para reservar', { icon: '👋' });
      router.push('/login');
      return;
    }
    
    if (!form.fechaCheckIn || !form.fechaCheckOut) {
      toast.error('Selecciona las fechas de estadía');
      return;
    }

    // Bloquear si hay error de fechas
    if (fechaError) {
      toast.error(fechaError);
      return;
    }

    setBookingLoading(true);
    try {
      // Intentar reservar en la API real (Si falla usamos el mock)
      await reservasApi.post('/reservas', {
        clienteId: user?.usuarioId || user?.clienteId || user?.id || 1, // Fallback si no tiene id
        alojamientoId: parseInt(id),
        fechaCheckIn: new Date(form.fechaCheckIn).toISOString().split('T')[0],
        fechaCheckOut: new Date(form.fechaCheckOut).toISOString().split('T')[0],
        numAdultos: form.numAdultos,
        numNinos: form.numNinos,
        llevaMascotas: form.llevaMascotas,
        habitaciones: selectedRooms.map(h => ({
          habitacionId: h.habitacionId,
          numNoches: nights || 1,
          precioPorNoche: h.precioNoche || 0
        }))
      });
      toast.success('¡Reserva creada exitosamente!');
      router.push('/mis-reservas');
    } catch (err) {
      console.error("API falló:", err);
      toast.error('Error real al crear la reserva en la base de datos.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!propiedad) return null;

  const coverImage = 'https://images.unsplash.com/photo-1542314831-c6a4d1409e1f?q=80&w=2000&auto=format&fit=crop';

  return (
    <>
      <div className={styles.hero}>
        <img src={coverImage} alt={propiedad.nombre} className={styles.heroImage} />
        <div className={styles.heroOverlay} />
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.location}>
            <MapPin size={18} /> {propiedad.ciudad || 'Sin ciudad'}
          </div>
          <h1 className={styles.title}>{propiedad.nombre}</h1>
          <div style={{ display: 'flex', gap: '1rem', color: '#cbd5e1' }}>
            <span>{propiedad.direccion}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#c9a96e' }}>
              <Star size={16} fill="currentColor" /> 4.9 (128 reseñas)
            </span>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.mainCol}>
            
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Acerca de este lugar</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                {propiedad.descripcion || 'Una hermosa propiedad lista para brindarte la mejor experiencia durante tu estadía. Disfruta de nuestras instalaciones de primera clase y la atención personalizada de nuestro equipo.'}
              </p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Servicios e Instalaciones</h2>
              <div className={styles.amenitiesList}>
                {propiedad.tienePiscina && (
                  <div className={styles.amenityItem}><Waves size={20} /> Piscina al aire libre</div>
                )}
                {propiedad.tieneParqueadero && (
                  <div className={styles.amenityItem}><Car size={20} /> Parqueadero privado</div>
                )}
                {propiedad.admiteMascotas && (
                  <div className={styles.amenityItem}><PawPrint size={20} /> Admite mascotas</div>
                )}
                <div className={styles.amenityItem}><Wind size={20} /> Aire acondicionado</div>
                <div className={styles.amenityItem}><CheckCircle2 size={20} /> Wi-Fi de alta velocidad</div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Habitaciones Disponibles</h2>
              {habitaciones.length === 0 ? (
                <p className="text-secondary">No hay habitaciones configuradas para este alojamiento.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {habitaciones.map(h => {
                    const selected = form.habitacionIds.includes(h.habitacionId);
                    return (
                      <div 
                        key={h.habitacionId} 
                        className={`${styles.roomCard} ${selected ? styles.selected : ''}`}
                        onClick={() => toggleHabitacion(h.habitacionId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <h3 className={styles.roomTitle}>{h.nombre}</h3>
                          <div className={styles.roomTags}>
                            <span className={styles.roomTag}><Users size={14} /> {h.capacidadAdultos} Adul. {h.capacidadNinos > 0 && `, ${h.capacidadNinos} Niños`}</span>
                            <span className={styles.roomTag}><BedDouble size={14} /> {h.numDormitorios} Dormitorios</span>
                            {h.superficieM2 && <span className={styles.roomTag}>{h.superficieM2}m²</span>}
                          </div>
                          <p className="text-sm text-secondary">{h.descripcion || 'Habitación confortable con todas las comodidades.'}</p>
                        </div>
                        <div className={styles.roomPrice}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                              ${h.precioNoche?.toFixed(2)}
                            </div>
                            <span className="text-xs text-muted">/ noche</span>
                          </div>
                          <button 
                            className={`btn btn-sm ${selected ? 'btn-accent' : 'btn-outline'}`}
                            onClick={(e) => { e.stopPropagation(); toggleHabitacion(h.habitacionId); }}
                          >
                            {selected ? 'Seleccionada' : 'Seleccionar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          <aside>
            <div className={styles.bookingWidget}>
              <div className={styles.priceDisplay}>
                ${pricePerNight.toFixed(2)} <span className="text-sm text-muted" style={{ fontWeight: 400 }}>/ noche</span>
              </div>

              <form className={styles.bookingForm} onSubmit={handleBooking}>
                <div className={styles.formGrid}>
                  <div className="input-group">
                    <label className="input-label">Check-in</label>
                    <input type="date" className="input-field" required min={hoy} value={form.fechaCheckIn} onChange={e => handleFechaChange('fechaCheckIn', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Check-out</label>
                    <input type="date" className="input-field" required min={form.fechaCheckIn || hoy} value={form.fechaCheckOut} onChange={e => handleFechaChange('fechaCheckOut', e.target.value)} />
                  </div>
                </div>

                {fechaError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginTop: '0.5rem' }}>
                    <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '0.8125rem', color: '#ef4444', margin: 0 }}>{fechaError}</p>
                  </div>
                )}

                <div className={styles.formGrid}>
                  <div className="input-group">
                    <label className="input-label">Adultos</label>
                    <select className="input-field" value={form.numAdultos} onChange={e => setForm({...form, numAdultos: parseInt(e.target.value)})}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Niños</label>
                    <select className="input-field" value={form.numNinos} onChange={e => setForm({...form, numNinos: parseInt(e.target.value)})}>
                      {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {propiedad.admiteMascotas && (
                  <div className="toggle-wrapper" style={{ marginTop: '0.5rem' }}>
                    <button type="button" className={`toggle ${form.llevaMascotas ? 'active' : ''}`} onClick={() => setForm({...form, llevaMascotas: !form.llevaMascotas})} />
                    <span className="text-sm font-medium">Llevaré mascotas</span>
                  </div>
                )}

                {nights > 0 && selectedRooms.length > 0 && (
                  <div className={styles.totalSummary}>
                    <div className={styles.summaryRow}>
                      <span>${pricePerNight.toFixed(2)} x {nights} noches</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Impuestos (15%)</span>
                      <span>${taxes.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryTotal}>
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.125rem' }}
                  disabled={bookingLoading || selectedRooms.length === 0 || !!fechaError || !form.fechaCheckIn || !form.fechaCheckOut}
                >
                  {bookingLoading ? <div className="spinner" /> : 'Reservar ahora'}
                </button>
                <p className="text-xs text-center text-muted" style={{ marginTop: '0.5rem' }}>
                  No se realizará ningún cargo aún
                </p>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
