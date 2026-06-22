import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';

export default function AlojamientoDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated, user } = useAuth();

  const [alojamiento, setAlojamiento] = useState<any>(null);
  const [habitaciones, setHabitaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selección para reserva rápida (simplificada para móvil)
  const [selectedHabitacion, setSelectedHabitacion] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alojRes, habRes] = await Promise.all([
          api.getAlojamiento(Number(id)),
          api.getHabitaciones(Number(id)),
        ]);
        setAlojamiento(alojRes);
        setHabitaciones(Array.isArray(habRes) ? habRes : []);
        if (Array.isArray(habRes) && habRes.length > 0) {
          setSelectedHabitacion(habRes[0].habitacionId);
        }
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar la información.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReserva = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!selectedHabitacion) {
      Alert.alert('Error', 'Selecciona una habitación');
      return;
    }

    const selectedRoomData = habitaciones.find(h => h.habitacionId === selectedHabitacion);
    
    // Redirigir a checkout pasando datos por query params
    router.push({
      pathname: `/checkout/${id}`,
      params: {
        habitacionId: selectedRoomData.habitacionId,
        precioNoche: selectedRoomData.precioNoche || 0,
        noches: 2, // Hardcodeado para el flujo demo
        alojamientoNombre: alojamiento.nombre
      }
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!alojamiento) return null;

  const precioMinimo = habitaciones.length > 0 
    ? Math.min(...habitaciones.map(h => h.precioNoche || Infinity)) 
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header con Imagen */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542314831-c6a4d1409e1f?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.image} 
          />
          <View style={styles.overlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <View style={[styles.circleBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{alojamiento.nombre}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>
          <Text style={[styles.location, { color: colors.primary }]}>
            <Ionicons name="location" size={14} /> {alojamiento.ciudad} - {alojamiento.direccion}
          </Text>
          
          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acerca del lugar</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {alojamiento.descripcion || 'Una hermosa propiedad lista para brindarte la mejor experiencia.'}
          </Text>

          {/* Amenidades */}
          <View style={styles.amenities}>
            {alojamiento.tienePiscina && (
              <View style={[styles.amenityBadge, { backgroundColor: colors.background }]}>
                <Ionicons name="water" size={18} color={colors.primary} />
                <Text style={[styles.amenityText, { color: colors.text }]}>Piscina</Text>
              </View>
            )}
            {alojamiento.tieneParqueadero && (
              <View style={[styles.amenityBadge, { backgroundColor: colors.background }]}>
                <Ionicons name="car" size={18} color={colors.primary} />
                <Text style={[styles.amenityText, { color: colors.text }]}>Parqueo</Text>
              </View>
            )}
            {alojamiento.admiteMascotas && (
              <View style={[styles.amenityBadge, { backgroundColor: colors.background }]}>
                <Ionicons name="paw" size={18} color={colors.primary} />
                <Text style={[styles.amenityText, { color: colors.text }]}>Mascotas</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Habitaciones Disponibles</Text>
          {habitaciones.map(h => (
            <TouchableOpacity 
              key={h.habitacionId} 
              style={[
                styles.roomCard, 
                { backgroundColor: colors.background, borderColor: selectedHabitacion === h.habitacionId ? colors.primary : colors.border },
                selectedHabitacion === h.habitacionId && { borderWidth: 2 }
              ]}
              onPress={() => setSelectedHabitacion(h.habitacionId)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.roomTitle, { color: colors.text }]}>{h.nombre}</Text>
                <Text style={[styles.roomSubtitle, { color: colors.textSecondary }]}>
                  {h.capacidadAdultos} Adul. • {h.numDormitorios} Dorm.
                </Text>
              </View>
              <Text style={[styles.roomPrice, { color: colors.primaryDark }]}>${h.precioNoche?.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomPrice, { color: colors.text }]}>
            ${precioMinimo === Infinity ? '0.00' : precioMinimo.toFixed(2)}
          </Text>
          <Text style={[styles.bottomLabel, { color: colors.textSecondary }]}>precio base / noche</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          onPress={handleReserva}
        >
          <Text style={styles.bookBtnText}>Reservar Ahora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: 350, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800', flex: 1, marginRight: 16 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { marginLeft: 4, fontWeight: '700', color: '#b45309' },
  location: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  amenityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8 },
  amenityText: { fontSize: 14, fontWeight: '500' },
  roomCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  roomTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  roomSubtitle: { fontSize: 13 },
  roomPrice: { fontSize: 18, fontWeight: '800' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
  bottomPrice: { fontSize: 22, fontWeight: '800' },
  bottomLabel: { fontSize: 12 },
  bookBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
