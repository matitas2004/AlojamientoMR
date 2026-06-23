import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import { Alojamientos } from '@/lib/api';

const DARK = { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6' };
const LIGHT = { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB' };
const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

function Amenity({ icon, label, C }) {
  return (
    <View style={[styles.amenity, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Ionicons name={icon} size={20} color={C.primary} />
      <Text style={[styles.amenityText, { color: C.text }]}>{label}</Text>
    </View>
  );
}

// ── Custom Native Calendar ───────────────────────────────────────────────────
function CustomCalendar({ blockedDates, checkIn, checkOut, onSelectDates, C }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sunday

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayPress = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Validar fecha pasada
    if (dateStr < todayStr) return;
    // Validar bloqueada
    if (blockedDates.has(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onSelectDates(dateStr, null);
    } else {
      // CheckOut selection
      if (dateStr <= checkIn) {
        onSelectDates(dateStr, null);
      } else {
        // Verificar si hay fechas bloqueadas en el medio
        let d = new Date(checkIn);
        const end = new Date(dateStr);
        let valid = true;
        while (d <= end) {
          const ds = d.toISOString().split('T')[0];
          if (blockedDates.has(ds)) {
            valid = false; break;
          }
          d.setDate(d.getDate() + 1);
        }
        if (valid) {
          onSelectDates(checkIn, dateStr);
        } else {
          Alert.alert("Fechas no disponibles", "Hay fechas ocupadas en el rango seleccionado.");
          onSelectDates(dateStr, null);
        }
      }
    }
  };

  return (
    <View style={styles.calContainer}>
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.calBtn}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.calMonthText, { color: C.text }]}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.calBtn}>
          <Ionicons name="chevron-forward" size={20} color={C.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.calWeekRow}>
        {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => (
          <Text key={d} style={[styles.calWeekDay, { color: C.textSecondary }]}>{d}</Text>
        ))}
      </View>
      <View style={styles.calDaysGrid}>
        {days.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={styles.calDayBox} />;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          const isBlocked = blockedDates.has(dateStr);
          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
          
          let bgColor = 'transparent';
          let textColor = C.text;
          
          if (isPast || isBlocked) {
            textColor = C.border; // Gris
            bgColor = isBlocked ? `${C.border}40` : 'transparent';
          } else if (isCheckIn || isCheckOut) {
            bgColor = C.primary;
            textColor = '#fff';
          } else if (isInRange) {
            bgColor = `${C.primary}30`;
          }

          return (
            <TouchableOpacity 
              key={dateStr} 
              style={[styles.calDayBox, { backgroundColor: bgColor }, (isCheckIn || isCheckOut) && { borderRadius: 8 }]}
              onPress={() => handleDayPress(day)}
              disabled={isPast || isBlocked}
            >
              <Text style={[styles.calDayText, { color: textColor }, (isCheckIn || isCheckOut) && { fontWeight: '700' }]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AlojamientoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isAuthenticated } = useAuth();

  const [alojamiento, setAlojamiento] = useState<any>(null);
  const [habitaciones, setHabitaciones] = useState<any[]>([]);
  const [selectedHab, setSelectedHab] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fechas y Calendario
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  const fetchCalendario = async (habId: parseInt) => {
    try {
      const d = new Date();
      // Traemos el mes actual y el siguiente
      const m1 = d.getMonth() + 1;
      const y1 = d.getFullYear();
      
      let m2 = m1 + 1; let y2 = y1;
      if (m2 > 12) { m2 = 1; y2++; }

      const [res1, res2] = await Promise.all([
        Alojamientos.getDisponibilidad(habId, m1, y1),
        Alojamientos.getDisponibilidad(habId, m2, y2)
      ]);

      const bDates = new Set<string>();
      [...(res1.data || []), ...(res2.data || [])].forEach(c => {
        if (c.fecha && (c.estado === 'Ocupado' || c.estado === 'Bloqueado')) {
          bDates.add(c.fecha.split('T')[0]);
        }
      });
      setBlockedDates(bDates);
    } catch (err) {
      console.log('Error cargando calendario', err);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [alojRes, habRes] = await Promise.all([
        Alojamientos.getById(id),
        Alojamientos.getHabitaciones(id),
      ]);
      const aloj = alojRes.data?.value ?? alojRes.data;
      const habs = habRes.data?.value ?? habRes.data ?? [];
      setAlojamiento(aloj);
      setHabitaciones(Array.isArray(habs) ? habs : []);
      if (habs.length > 0) {
        setSelectedHab(habs[0]);
        fetchCalendario(habs[0].habitacionId);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el alojamiento.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleHabitacionSelect = (h: any) => {
    setSelectedHab(h);
    setCheckIn(null);
    setCheckOut(null);
    fetchCalendario(h.habitacionId);
  };

  const handleReservar = () => {
    if (!isAuthenticated) {
      router.push('/login' as any);
      return;
    }
    if (!selectedHab) {
      Alert.alert('Habitación', 'Selecciona una habitación.');
      return;
    }
    if (!checkIn || !checkOut) {
      Alert.alert('Fechas incompletas', 'Por favor selecciona la fecha de llegada y de salida en el calendario.');
      return;
    }
    router.push({
      pathname: `/checkout/${id}`,
      params: {
        habitacionId: selectedHab.habitacionId,
        precioNoche: selectedHab.precioNoche ?? 0,
        fechaCheckIn: checkIn,
        fechaCheckOut: checkOut,
        alojamientoNombre: alojamiento?.nombre ?? '',
      },
    } as any);
  };

  if (loading) return <View style={[styles.center, { backgroundColor: C.bg }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (!alojamiento) return <View style={[styles.center, { backgroundColor: C.bg }]}><Text style={{ color: C.text }}>Error al cargar</Text></View>;

  let nights = 0;
  if (checkIn && checkOut) {
    nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 3600 * 24)));
  }
  const precioTotal = (selectedHab?.precioNoche ?? 0) * nights;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: alojamiento.imagenUrl || PLACEHOLDER }} style={styles.image} defaultSource={{ uri: PLACEHOLDER }} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <View style={[styles.circleBtn, { backgroundColor: C.surface }]}>
              <Ionicons name="arrow-back" size={20} color={C.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={[styles.body, { backgroundColor: C.bg }]}>
          <Text style={[styles.name, { color: C.text }]}>{alojamiento.nombre}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={C.textSecondary} />
            <Text style={[styles.location, { color: C.textSecondary }]}>{alojamiento.ciudad || 'Ecuador'} · {alojamiento.direccion || ''}</Text>
          </View>

          {/* Amenities */}
          {(alojamiento.admiteMascotas || alojamiento.tienePiscina || alojamiento.tieneParqueadero) && (
            <View style={styles.amenities}>
              {alojamiento.admiteMascotas && <Amenity icon="paw" label="Mascotas" C={C} />}
              {alojamiento.tienePiscina && <Amenity icon="water" label="Piscina" C={C} />}
              {alojamiento.tieneParqueadero && <Amenity icon="car" label="Parqueadero" C={C} />}
            </View>
          )}

          {/* Descripción */}
          {alojamiento.descripcion && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Descripción</Text>
              <Text style={[styles.description, { color: C.textSecondary }]}>{alojamiento.descripcion}</Text>
            </View>
          )}

          {/* Habitaciones */}
          {habitaciones.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Selecciona una Habitación</Text>
              <View style={styles.habList}>
                {habitaciones.map(h => {
                  const selected = selectedHab?.habitacionId === h.habitacionId;
                  return (
                    <TouchableOpacity
                      key={h.habitacionId}
                      style={[ styles.habCard, { borderColor: selected ? C.primary : C.border, backgroundColor: C.surface }, selected && { borderWidth: 2 } ]}
                      onPress={() => handleHabitacionSelect(h)}
                    >
                      <View style={styles.habHeader}>
                        <Text style={[styles.habName, { color: C.text }]} numberOfLines={1}>{h.nombre}</Text>
                        {selected && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                      </View>
                      <View style={styles.habDetails}>
                        <View style={styles.habDetail}>
                          <Ionicons name="people-outline" size={13} color={C.textSecondary} />
                          <Text style={[styles.habDetailText, { color: C.textSecondary }]}>{h.capacidadAdultos} adultos</Text>
                        </View>
                        {h.numBanos > 0 && (
                          <View style={styles.habDetail}>
                            <Ionicons name="water-outline" size={13} color={C.textSecondary} />
                            <Text style={[styles.habDetailText, { color: C.textSecondary }]}>{h.numBanos} baño(s)</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.habPrice, { color: C.primary }]}>
                        ${(h.precioNoche ?? 0).toFixed(2)} <Text style={[styles.habPriceSub, { color: C.textSecondary }]}>/noche</Text>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Calendario Visual ──────────────────────────────────────── */}
          {selectedHab && (
            <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border, borderRadius: 14, borderWidth: 1, padding: 16 }]}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Fechas de tu Estadía</Text>
              <CustomCalendar 
                blockedDates={blockedDates} 
                checkIn={checkIn} 
                checkOut={checkOut} 
                onSelectDates={(inDate, outDate) => { setCheckIn(inDate); setCheckOut(outDate); }}
                C={C}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: C.textSecondary }}>Llegada</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>{checkIn || '-- / -- / ----'}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: C.border }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: C.textSecondary }}>Salida</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>{checkOut || '-- / -- / ----'}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* CTA Bottom */}
      <View style={[styles.bottomBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        {selectedHab && checkIn && checkOut ? (
          <View>
            <Text style={[styles.priceLabel, { color: C.textSecondary }]}>Total ({nights}n)</Text>
            <Text style={[styles.priceValue, { color: C.text }]}>${precioTotal.toFixed(2)}</Text>
          </View>
        ) : (
          <View>
            <Text style={[styles.priceLabel, { color: C.textSecondary }]}>Desde</Text>
            <Text style={[styles.priceValue, { color: C.text }]}>${(selectedHab?.precioNoche ?? 0).toFixed(2)}<Text style={{fontSize:13}}>/n</Text></Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: C.primary, opacity: (!checkIn || !checkOut) ? 0.6 : 1 }]}
          onPress={handleReservar}
        >
          <Text style={styles.ctaText}>
            {isAuthenticated ? 'Reservar Ahora' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: 300, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 10 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  body: { borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 24, gap: 4 },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  location: { fontSize: 14, flex: 1 },
  amenities: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  amenityText: { fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22 },
  habList: { gap: 10 },
  habCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  habHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  habName: { fontSize: 15, fontWeight: '600', flex: 1 },
  habDetails: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  habDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  habDetailText: { fontSize: 12 },
  habPrice: { fontSize: 17, fontWeight: '800' },
  habPriceSub: { fontSize: 13, fontWeight: '400' },
  // ── Bottom Bar ────────────────────────────────────────────────────────────
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, borderTopWidth: 1 },
  priceLabel: { fontSize: 12 },
  priceValue: { fontSize: 18, fontWeight: '700' },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // ── Calendario ────────────────────────────────────────────────────────────
  calContainer: { },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calMonthText: { fontSize: 15, fontWeight: '700' },
  calBtn: { padding: 4 },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calWeekDay: { fontSize: 12, width: '14%', textAlign: 'center' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayBox: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
  calDayText: { fontSize: 14 },
});
