import React, { useEffect, useState, useCallback } from 'react';
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

export default function AlojamientoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isAuthenticated } = useAuth();

  const [alojamiento, setAlojamiento] = useState(null);
  const [habitaciones, setHabitaciones] = useState([]);
  const [selectedHab, setSelectedHab] = useState(null);
  const [loading, setLoading] = useState(true);

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
      if (habs.length > 0) setSelectedHab(habs[0]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar el alojamiento.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReservar = () => {
    if (!isAuthenticated) {
      router.push('/login' as any);
      return;
    }
    if (!selectedHab) {
      Alert.alert('Selecciona una habitación', 'Por favor elige una habitación antes de continuar.');
      return;
    }
    router.push({
      pathname: `/checkout/${id}`,
      params: {
        habitacionId: selectedHab.habitacionId,
        precioNoche: selectedHab.precioNoche ?? 0,
        noches: 2,
        alojamientoNombre: alojamiento?.nombre ?? '',
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!alojamiento) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Ionicons name="alert-circle-outline" size={52} color={C.textSecondary} />
        <Text style={[styles.errorText, { color: C.textSecondary }]}>No se encontró el alojamiento</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.link, { color: C.primary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: alojamiento.imagenUrl || PLACEHOLDER }}
            style={styles.image}
            defaultSource={{ uri: PLACEHOLDER }}
          />
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
            <Text style={[styles.location, { color: C.textSecondary }]}>
              {alojamiento.ciudad || 'Ecuador'} · {alojamiento.direccion || ''}
            </Text>
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
                      style={[
                        styles.habCard,
                        { borderColor: selected ? C.primary : C.border, backgroundColor: C.surface },
                        selected && { borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedHab(h)}
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

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* CTA Bottom */}
      <View style={[styles.bottomBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        {selectedHab && (
          <View>
            <Text style={[styles.priceLabel, { color: C.textSecondary }]}>Desde</Text>
            <Text style={[styles.priceValue, { color: C.text }]}>
              ${(selectedHab.precioNoche ?? 0).toFixed(2)}/noche
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: C.primary }]}
          onPress={handleReservar}
        >
          <Text style={styles.ctaText}>
            {isAuthenticated ? 'Reservar Ahora' : 'Iniciar Sesión para Reservar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, textAlign: 'center' },
  link: { fontSize: 15, fontWeight: '700' },
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
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
    borderTopWidth: 1,
  },
  priceLabel: { fontSize: 12 },
  priceValue: { fontSize: 18, fontWeight: '700' },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
