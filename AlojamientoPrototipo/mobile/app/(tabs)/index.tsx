import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { Alojamientos } from '@/lib/api';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

const DARK = {
  bg: '#0F172A', surface: '#1E293B', border: '#334155',
  text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6',
};
const LIGHT = {
  bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB',
};

export default function ExplorarScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;

  const [alojamientos, setAlojamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await Alojamientos.getAll();
      const data = res.data?.value ?? res.data ?? [];
      setAlojamientos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.friendlyMessage || 'Error al cargar alojamientos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const filtered = alojamientos.filter(a =>
    (a.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.ciudad || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderCard = ({ item }) => (
    <Link href={`/alojamiento/${item.alojamientoId}`} asChild>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
        activeOpacity={0.85}
      >
      <Image
        source={{ uri: item.imagenUrl || PLACEHOLDER }}
        style={styles.cardImage}
        defaultSource={{ uri: PLACEHOLDER }}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>
            {item.nombre}
          </Text>
          {item.admiteMascotas && (
            <Ionicons name="paw" size={14} color="#F59E0B" />
          )}
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={14} color={C.textSecondary} />
          <Text style={[styles.cardCity, { color: C.textSecondary }]} numberOfLines={1}>
            {item.ciudad || 'Ecuador'}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.amenities}>
            {item.tienePiscina && (
              <View style={styles.badge}><Text style={styles.badgeText}>Piscina</Text></View>
            )}
            {item.tieneParqueadero && (
              <View style={styles.badge}><Text style={styles.badgeText}>Parqueadero</Text></View>
            )}
          </View>
          <Text style={[styles.cardAction, { color: C.primary }]}>Ver →</Text>
        </View>
      </View>
    </TouchableOpacity>
    </Link>
  );

  const renderSkeleton = () => (
    <View style={{ gap: 16 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.card, styles.skeleton, { backgroundColor: C.surface }]} />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>AlojamientoMR</Text>
          <Text style={[styles.headerSub, { color: C.textSecondary }]}>Encuentra tu lugar perfecto</Text>
        </View>
        <Ionicons name="bed-outline" size={28} color={C.primary} />
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="search-outline" size={18} color={C.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder="Buscar por nombre o ciudad..."
          placeholderTextColor={C.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.listPad}>{renderSkeleton()}</View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={52} color={C.textSecondary} />
          <Text style={[styles.errorText, { color: C.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { borderColor: C.primary }]} onPress={fetchData}>
            <Text style={[styles.retryText, { color: C.primary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.alojamientoId)}
          renderItem={renderCard}
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={52} color={C.textSecondary} />
              <Text style={[styles.errorText, { color: C.textSecondary }]}>
                {search ? 'Sin resultados para esa búsqueda' : 'No hay alojamientos disponibles'}
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 14, height: 46,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  listPad: { padding: 16, gap: 16 },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  cardCity: { fontSize: 13 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amenities: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: 'rgba(59,130,246,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, color: '#3B82F6', fontWeight: '600' },
  cardAction: { fontSize: 14, fontWeight: '700' },
  skeleton: { height: 260 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  errorText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 2 },
  retryText: { fontWeight: '700', fontSize: 15 },
});
