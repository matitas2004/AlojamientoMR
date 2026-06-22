import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'expo-router';

const estadoColor: Record<string, string> = {
  Pendiente: '#f59e0b',
  Confirmada: '#22c55e',
  Cancelada: '#ef4444',
  Completada: '#3b82f6',
};

export default function ReservasScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservas = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await api.getReservas();
      setReservas(Array.isArray(data) ? data : []);
    } catch {
      // silenciar
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchReservas(); }, [fetchReservas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservas();
  }, [fetchReservas]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={56} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Inicia sesión</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Para ver tus reservas necesitas una cuenta
        </Text>
        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const estado = item.estado || 'Pendiente';
    const badgeColor = estadoColor[estado] || '#94a3b8';
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.code, { color: colors.primary }]}>#{item.codigoReserva}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {item.fechaCheckIn?.split('T')[0]} → {item.fechaCheckOut?.split('T')[0]}
            </Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {item.numAdultos} adulto(s), {item.numNinos} niño(s)
            </Text>
          </View>
          <View>
            <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{estado}</Text>
            </View>
            <Text style={[styles.total, { color: colors.text }]}>${item.total?.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <Ionicons name="hourglass-outline" size={32} color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Cargando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={reservas}
          renderItem={renderItem}
          keyExtractor={item => String(item.reservaId)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin reservas aún</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Explora alojamientos y haz tu primera reserva
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  list: { padding: 16, paddingBottom: 24 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  code: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 3 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-end' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  total: { fontSize: 17, fontWeight: '700', marginTop: 8, textAlign: 'right' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  loginBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
