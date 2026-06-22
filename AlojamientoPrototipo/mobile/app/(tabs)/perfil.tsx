import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'expo-router';

export default function PerfilScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.title, { color: colors.text }]}>Mi Perfil</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Inicia sesión para gestionar tu cuenta
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: colors.primaryDark }]}>
            {user?.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.nombreCompleto || 'Usuario'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'Sin correo'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.roleText, { color: colors.primaryDark }]}>{user?.rol || 'Cliente'}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Configuración de la cuenta</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="help-buoy-outline" size={24} color={colors.text} />
          <Text style={[styles.menuText, { color: colors.text }]}>Ayuda y Soporte</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={[styles.menuText, { color: colors.error }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  header: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 15, marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  menu: { marginTop: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  menuText: { flex: 1, fontSize: 16, marginLeft: 16 },
});
