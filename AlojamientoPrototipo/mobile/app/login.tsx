import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import { Auth } from '@/lib/api';

const DARK = { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6' };
const LIGHT = { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB' };

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const res = await Auth.login(email.trim().toLowerCase(), password);
      const d = res.data;
      const token = d.token ?? d.accessToken ?? d.jwt ?? '';
      const userData = {
        usuarioId: d.usuarioId ?? d.userId ?? d.id,
        clienteId: d.clienteId ?? d.usuarioId ?? d.id,
        nombreCompleto: d.nombreCompleto ?? d.nombre ?? d.name ?? '',
        email: d.email ?? email,
        cedula: d.cedula ?? '',
        telefono: d.telefono ?? '',
      };
      await login(token, userData);
      router.back();
    } catch (err) {
      const msg = err?.response?.status === 401
        ? 'Correo o contraseña incorrectos.'
        : (err.friendlyMessage || 'No se pudo conectar al servidor.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={C.text} />
        </TouchableOpacity>

        {/* Logo / Title */}
        <View style={styles.hero}>
          <View style={[styles.logoCircle, { backgroundColor: C.primary }]}>
            <Ionicons name="bed-outline" size={36} color="#fff" />
          </View>
          <Text style={[styles.title, { color: C.text }]}>Bienvenido de nuevo</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Inicia sesión en tu cuenta</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.group}>
            <Text style={[styles.label, { color: C.text }]}>Correo Electrónico</Text>
            <View style={[styles.inputBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Ionicons name="mail-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={C.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={[styles.label, { color: C.text }]}>Contraseña</Text>
            <View style={[styles.inputBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="••••••••"
                placeholderTextColor={C.textSecondary}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: C.primary }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Iniciar Sesión</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: C.textSecondary }]}>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace('/register' as any)}>
            <Text style={[styles.footerLink, { color: C.primary }]}> Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 52, right: 24, zIndex: 10, padding: 4 },
  hero: { alignItems: 'center', marginBottom: 40, marginTop: 20, gap: 10 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15 },
  form: { gap: 20 },
  group: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, height: 52 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 15 },
  eyeBtn: { paddingRight: 14 },
  submitBtn: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
