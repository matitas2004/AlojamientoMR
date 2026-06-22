import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import api from '@/lib/api';

// Skeleton Loader para tarjetas
function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.skeletonImage, { backgroundColor: colors.skeleton }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton, width: '60%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton, width: '40%', marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton, width: '30%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

export default function ExplorarScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [alojamientos, setAlojamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await api.getAlojamientos();
      setAlojamientos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Los servidores están despertando. Desliza hacia abajo para reintentar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filtered = alojamientos.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (a.nombre?.toLowerCase().includes(q) || a.ciudad?.toLowerCase().includes(q));
  });

  const coverImages = [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542314831-c6a4d1409e1f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop',
  ];

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/alojamiento/${item.alojamientoId}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: coverImages[index % coverImages.length] }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardCity, { color: colors.primary }]}>
            <Ionicons name="location" size={13} color={colors.primary} /> {item.ciudad || 'Sin ciudad'}
          </Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text style={[styles.cardAddress, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.direccion}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.amenities}>
            {item.tienePiscina && <Ionicons name="water" size={14} color={colors.primary} />}
            {item.tieneParqueadero && <Ionicons name="car" size={14} color={colors.primary} />}
            {item.admiteMascotas && <Ionicons name="paw" size={14} color={colors.primary} />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra de búsqueda */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por ciudad o nombre..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} colors={colors} />)}
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => String(item.alojamientoId)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No se encontraron alojamientos
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    marginTop: 8, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  card: {
    borderRadius: 16, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: '100%', height: 200 },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCity: { fontSize: 13, fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#fbbf24' },
  cardTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  cardAddress: { fontSize: 13, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  amenities: { flexDirection: 'row', gap: 8 },
  skeletonList: { padding: 16 },
  skeletonImage: { width: '100%', height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  skeletonLine: { height: 14, borderRadius: 6 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
