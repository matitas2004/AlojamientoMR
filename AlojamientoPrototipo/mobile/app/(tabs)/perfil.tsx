import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';

const DARK = {
  bg: '#0F172A', surface: '#1E293B', border: '#334155',
  text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6', danger: '#EF4444',
};
const LIGHT = {
  bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB', danger: '#DC2626',
};

function InfoRow({ icon, label, value, C }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: `${C.primary}18` }]}>
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <View>
        <Text style={[styles.infoLabel, { color: C.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: C.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/' as any);
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <View style={[styles.avatarBig, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="person-outline" size={48} color={C.textSecondary} />
        </View>
        <Text style={[styles.title, { color: C.text }]}>¡Hola, viajero!</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Inicia sesión para gestionar tus reservas y perfil
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.primary }]}
          onPress={() => router.push('/login' as any)}
        >
          <Text style={styles.btnText}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: C.border }]}
          onPress={() => router.push('/register' as any)}
        >
          <Text style={[styles.btnOutlineText, { color: C.text }]}>Crear Cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = (user?.nombreCompleto || user?.nombre || 'U')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <ScrollView style={[styles.container, { backgroundColor: C.bg }]} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={[styles.heroHeader, { backgroundColor: C.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{user?.nombreCompleto || user?.nombre || 'Usuario'}</Text>
        <Text style={styles.heroEmail}>{user?.email || '—'}</Text>
      </View>

      {/* Info */}
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>INFORMACIÓN DE CUENTA</Text>
        <InfoRow icon="person-outline" label="Nombre" value={user?.nombreCompleto || user?.nombre || '—'} C={C} />
        <InfoRow icon="mail-outline" label="Correo" value={user?.email || '—'} C={C} />
        <InfoRow icon="card-outline" label="Cédula" value={user?.cedula || '—'} C={C} />
        <InfoRow icon="call-outline" label="Teléfono" value={user?.telefono || '—'} C={C} />
      </View>

      {/* Acciones */}
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>ACCIONES</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/reservas' as any)}>
          <View style={[styles.infoIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Ionicons name="calendar-outline" size={18} color={C.primary} />
          </View>
          <Text style={[styles.actionText, { color: C.text }]}>Ver mis reservas</Text>
          <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: C.danger }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={C.danger} />
        <Text style={[styles.logoutText, { color: C.danger }]}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroHeader: {
    paddingTop: 60, paddingBottom: 32, alignItems: 'center', gap: 6,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  heroEmail: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  card: {
    margin: 16, marginBottom: 0, borderRadius: 14, borderWidth: 1,
    padding: 16, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    margin: 16, marginTop: 20, paddingVertical: 14,
    borderRadius: 14, borderWidth: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
  // Not authenticated styles
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },
  avatarBig: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  btn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnOutline: { width: '100%', paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  btnOutlineText: { fontWeight: '700', fontSize: 16 },
});
