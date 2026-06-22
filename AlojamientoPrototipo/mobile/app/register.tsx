import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { Auth } from '@/lib/api';

const DARK = { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6' };
const LIGHT = { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB' };

export default function RegisterScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;

  const [form, setForm] = useState({ nombreCompleto: '', email: '', password: '', cedula: '', telefono: '', domicilio: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.nombreCompleto || !form.email || !form.password || !form.cedula || !form.telefono || !form.domicilio) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.cedula.length !== 10 || !/^\d+$/.test(form.cedula)) {
      Alert.alert('Cédula inválida', 'La cédula debe contener exactamente 10 dígitos numéricos.');
      return;
    }
    if (!/^\d+$/.test(form.telefono)) {
      Alert.alert('Teléfono inválido', 'El teléfono debe contener solo números.');
      return;
    }
    setLoading(true);
    try {
      await Auth.register({
        nombreCompleto: form.nombreCompleto,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        cedula: form.cedula,
        telefono: form.telefono,
        domicilio: form.domicilio,
      });
      Alert.alert('¡Cuenta creada!', 'Ahora puedes iniciar sesión.', [
        { text: 'Iniciar Sesión', onPress: () => router.replace('/login' as any) },
      ]);
    } catch (err) {
      const status = err?.response?.status;
      const serverErrors = err?.response?.data?.errors;
      let msg = err.friendlyMessage || 'No se pudo crear la cuenta.';
      
      if (status === 400) {
        if (serverErrors) {
          const errorDetails = Object.values(serverErrors).flat().join('\n');
          msg = `Datos inválidos:\n${errorDetails}`;
        } else if (err?.response?.data?.mensaje) {
          msg = err.response.data.mensaje;
        } else {
          msg = 'El correo o la cédula ya están registrados, o hay datos inválidos.';
        }
      }
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
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={C.text} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={[styles.logoCircle, { backgroundColor: C.primary }]}>
            <Ionicons name="person-add-outline" size={34} color="#fff" />
          </View>
          <Text style={[styles.title, { color: C.text }]}>Crear Cuenta</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Únete a AlojamientoMR</Text>
        </View>

        <View style={styles.form}>
          {[
            { key: 'nombreCompleto', label: 'Nombre Completo', icon: 'person-outline', placeholder: 'Juan Pérez' },
            { key: 'email', label: 'Correo Electrónico', icon: 'mail-outline', placeholder: 'juan@correo.com', keyboard: 'email-address', lower: true },
            { key: 'cedula', label: 'Cédula', icon: 'card-outline', placeholder: '10 dígitos (ej: 1712345678)', keyboard: 'number-pad' },
            { key: 'telefono', label: 'Teléfono', icon: 'call-outline', placeholder: 'ej: 0991234567', keyboard: 'phone-pad' },
            { key: 'domicilio', label: 'Dirección de Domicilio', icon: 'home-outline', placeholder: 'Av. Amazonas y Patria' },
          ].map(f => (
            <View key={f.key} style={styles.group}>
              <Text style={[styles.label, { color: C.text }]}>{f.label}</Text>
              <View style={[styles.inputBox, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Ionicons name={f.icon as any} size={18} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.textSecondary}
                  keyboardType={(f.keyboard as any) || 'default'}
                  autoCapitalize={f.lower ? 'none' : 'words'}
                  autoCorrect={false}
                  value={form[f.key]}
                  onChangeText={set(f.key)}
                />
              </View>
            </View>
          ))}

          {/* Password */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: C.text }]}>Contraseña</Text>
            <View style={[styles.inputBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={C.textSecondary}
                secureTextEntry={!showPass}
                value={form.password}
                onChangeText={set('password')}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: C.primary }, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Crear Cuenta</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: C.textSecondary }]}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.replace('/login' as any)}>
            <Text style={[styles.footerLink, { color: C.primary }]}> Inicia Sesión</Text>
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
  hero: { alignItems: 'center', marginBottom: 36, marginTop: 20, gap: 10 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15 },
  form: { gap: 16 },
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, height: 50 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 15 },
  eyeBtn: { paddingRight: 14 },
  submitBtn: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
