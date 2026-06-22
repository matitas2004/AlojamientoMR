import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { Facturas } from '@/lib/api';

const DARK = { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6', success: '#10B981' };
const LIGHT = { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB', success: '#059669' };

export default function FacturaScreen() {
  const router = useRouter();
  const { id, totalFallback, alojamientoNombre } = useLocalSearchParams();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;

  const reservaId = Number(id);
  const fallback = Number(totalFallback) || 0;

  const [loading, setLoading] = useState(true);
  const [factura, setFactura] = useState(null);

  useEffect(() => {
    Facturas.getByReserva(reservaId)
      .then(res => {
        const d = res.data?.value ?? res.data;
        if (Array.isArray(d)) {
          setFactura(d.length > 0 ? d[0] : null);
        } else {
          setFactura(d);
        }
      })
      .catch(() => {
        // Usamos mock con el total calculado localmente
        setFactura({ facturaId: null, monto: fallback, estado: 'Emitida', fechaEmision: new Date().toISOString() });
      })
      .finally(() => setLoading(false));
  }, [reservaId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.loadingText, { color: C.textSecondary }]}>Generando recibo...</Text>
      </View>
    );
  }

  // Fallback: si el monto de la BD es 0, usar el calculado en checkout
  const monto = (factura?.monto && factura.monto > 0) ? factura.monto : fallback;
  const fecha = factura?.fechaEmision?.split('T')[0] ?? new Date().toISOString().split('T')[0];

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <TouchableOpacity style={[styles.closeBtn, { backgroundColor: C.surface }]} onPress={() => router.replace('/(tabs)/reservas' as any)}>
        <Ionicons name="close" size={22} color={C.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successArea}>
          <View style={[styles.successCircle, { backgroundColor: `${C.success}18` }]}>
            <Ionicons name="checkmark-circle" size={72} color={C.success} />
          </View>
          <Text style={[styles.successTitle, { color: C.text }]}>¡Pago Exitoso!</Text>
          <Text style={[styles.successSub, { color: C.textSecondary }]}>
            Tu reserva en {alojamientoNombre || 'el alojamiento'} ha sido confirmada.
          </Text>
        </View>

        {/* Recibo */}
        <View style={[styles.receipt, { backgroundColor: C.surface, borderColor: C.border }]}>
          {/* Header */}
          <View style={styles.receiptHeader}>
            <Text style={[styles.brand, { color: C.primary }]}>AlojamientoMR</Text>
            <Text style={[styles.receiptDate, { color: C.textSecondary }]}>{fecha}</Text>
          </View>

          <View style={[styles.dashed, { borderColor: C.border }]} />

          {[
            { label: 'N° Factura', value: factura?.facturaId ? `FAC-${factura.facturaId}` : 'PROCESANDO' },
            { label: 'N° Reserva', value: `RES-${reservaId}` },
            { label: 'Estado', value: factura?.estado ?? 'Pagado', success: true },
          ].map(row => (
            <View key={row.label} style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: C.textSecondary }]}>{row.label}</Text>
              <Text style={[styles.receiptValue, { color: row.success ? C.success : C.text }]}>
                {row.value}
              </Text>
            </View>
          ))}

          <View style={[styles.dashed, { borderColor: C.border }]} />

          <View style={styles.receiptRow}>
            <Text style={[styles.totalLabel, { color: C.text }]}>Total Pagado</Text>
            <Text style={[styles.totalValue, { color: C.primary }]}>${monto.toFixed(2)}</Text>
          </View>
        </View>

        {/* Acciones */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.primary }]}
          onPress={() => router.replace('/(tabs)/reservas' as any)}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Ver mis reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: C.border }]}
          onPress={() => router.replace('/' as any)}
        >
          <Text style={[styles.btnOutlineText, { color: C.text }]}>Explorar más alojamientos</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15 },
  closeBtn: { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  scroll: { padding: 24, paddingTop: 80, gap: 16 },
  successArea: { alignItems: 'center', gap: 10, marginBottom: 8 },
  successCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  successTitle: { fontSize: 26, fontWeight: '800' },
  successSub: { fontSize: 15, textAlign: 'center', paddingHorizontal: 20 },
  receipt: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 18, fontWeight: '800' },
  receiptDate: { fontSize: 13 },
  dashed: { borderWidth: 1, borderStyle: 'dashed', marginVertical: 4 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: 14 },
  receiptValue: { fontSize: 14, fontWeight: '600' },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  totalValue: { fontSize: 26, fontWeight: '800' },
  btn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: { paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  btnOutlineText: { fontSize: 15, fontWeight: '600' },
});
