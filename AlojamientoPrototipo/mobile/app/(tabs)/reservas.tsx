import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import { Reservas } from '@/lib/api';

const DARK = {
  bg: '#0F172A', surface: '#1E293B', border: '#334155',
  text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6',
};
const LIGHT = {
  bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB',
};

const STATE_STYLES = {
  confirmada: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: 'checkmark-circle' },
  pendiente:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: 'time' },
  cancelada:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   icon: 'close-circle' },
  completada: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  icon: 'checkmark-done-circle' },
};

function EstadoBadge({ estado }) {
  const e = (estado || 'pendiente').toLowerCase();
  const s = STATE_STYLES[e] || STATE_STYLES.pendiente;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={13} color={s.color} />
      <Text style={[styles.badgeText, { color: s.color }]}>
        {estado || 'Pendiente'}
      </Text>
    </View>
  );
}

export default function ReservasScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isAuthenticated, user } = useAuth();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReservas = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      setError(null);
      const clienteId = user.clienteId ?? user.usuarioId;
      const res = await Reservas.getMisReservas(clienteId);
      const data = res.data?.value ?? res.data ?? [];
      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.friendlyMessage || 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchReservas();
    }
  }, [isAuthenticated, fetchReservas]);

  const onRefresh = () => { setRefreshing(true); fetchReservas(); };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Ionicons name="calendar-outline" size={64} color={C.textSecondary} />
        <Text style={[styles.emptyTitle, { color: C.text }]}>Inicia sesión para ver tus reservas</Text>
        <TouchableOpacity style={[styles.loginBtn, { backgroundColor: C.primary }]} onPress={() => router.push('/login' as any)}>
          <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Mis Reservas</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={52} color={C.textSecondary} />
          <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { borderColor: C.primary }]} onPress={fetchReservas}>
            <Text style={[styles.retryText, { color: C.primary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={item => String(item.reservaId)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={52} color={C.textSecondary} />
              <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>Aún no tienes reservas</Text>
              <TouchableOpacity style={[styles.loginBtn, { backgroundColor: C.primary }]} onPress={() => router.push('/' as any)}>
                <Text style={styles.loginBtnText}>Explorar Alojamientos</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.codigo, { color: C.primary }]}>
                  {item.codigoReserva || item.codigo || `#${item.reservaId}`}
                </Text>
                <EstadoBadge estado={item.estado} />
              </View>
              <Text style={[styles.propiedad, { color: C.text }]} numberOfLines={1}>
                {item.propiedadNombre || `Alojamiento #${item.alojamientoId}`}
              </Text>
              <View style={[styles.divider, { backgroundColor: C.border }]} />
              <View style={styles.dateRow}>
                <View style={styles.dateItem}>
                  <Text style={[styles.dateLabel, { color: C.textSecondary }]}>Check-in</Text>
                  <Text style={[styles.dateValue, { color: C.text }]}>{formatDate(item.fechaCheckIn)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={C.textSecondary} />
                <View style={styles.dateItem}>
                  <Text style={[styles.dateLabel, { color: C.textSecondary }]}>Check-out</Text>
                  <Text style={[styles.dateValue, { color: C.text }]}>{formatDate(item.fechaCheckOut)}</Text>
                </View>
                <View style={styles.totalBox}>
                  <Text style={[styles.totalLabel, { color: C.textSecondary }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: C.primary }]}>
                    ${(item.total || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  codigo: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  propiedad: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  divider: { height: 1, marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 11, marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '600' },
  totalBox: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 11, marginBottom: 2 },
  totalValue: { fontSize: 16, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32, paddingTop: 80 },
  emptyTitle: { fontSize: 16, textAlign: 'center' },
  loginBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 2 },
  retryText: { fontWeight: '700', fontSize: 15 },
});
