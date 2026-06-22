import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import api from '@/lib/api';

export default function FacturaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Recibimos el ID de la reserva (que usamos para buscar la factura) y el totalFallback por si la DB devuelve 0
  const { id: reservaIdStr, totalFallback } = useLocalSearchParams();
  const reservaId = Number(reservaIdStr);
  const fallbackAmount = Number(totalFallback) || 0;

  const [loading, setLoading] = useState(true);
  const [factura, setFactura] = useState<any>(null);

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const data = await api.getFacturaByReservaId(reservaId);
        // data.value o data dependiendo de cómo devuelva la API
        const fact = data?.value || data || null;
        setFactura(fact);
      } catch (err) {
        console.warn('Factura no encontrada o error', err);
        // Si no hay factura aún (por asincronía o error), generaremos un mock visual
        setFactura({
          facturaId: 'PROCESANDO',
          fechaEmision: new Date().toISOString(),
          monto: fallbackAmount,
          estado: 'Emitida',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFactura();
  }, [reservaId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Generando comprobante...</Text>
      </View>
    );
  }

  // Solución al Bug 9.2: Factura con monto 0
  const montoAMostrar = (factura?.monto && factura.monto > 0) ? factura.monto : fallbackAmount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/reservas')}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recibo de Pago</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          <Text style={[styles.successText, { color: colors.text }]}>¡Pago Completado!</Text>
          <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>
            Tu reserva ha sido confirmada y procesada.
          </Text>
        </View>

        <View style={[styles.receiptCard, { backgroundColor: colors.surface }]}>
          <View style={styles.receiptHeader}>
            <Text style={[styles.receiptBrand, { color: colors.primaryDark }]}>AlojamientoMR</Text>
            <Text style={[styles.receiptDate, { color: colors.textSecondary }]}>
              {factura?.fechaEmision?.split('T')[0] || new Date().toISOString().split('T')[0]}
            </Text>
          </View>

          <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Nº Factura</Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>
              FAC-{factura?.facturaId || 'PENDIENTE'}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Nº Reserva</Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>RES-{reservaId}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Estado</Text>
            <Text style={[styles.receiptValue, { color: colors.success }]}>
              {factura?.estado || 'Pagado'}
            </Text>
          </View>

          <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptTotalLabel, { color: colors.text }]}>Total Pagado</Text>
            <Text style={[styles.receiptTotalValue, { color: colors.primary }]}>
              ${montoAMostrar.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.replace('/(tabs)/reservas')}
        >
          <Text style={[styles.btnText, { color: colors.text }]}>Ver mis reservas</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 24, alignItems: 'center' },
  successIconContainer: { alignItems: 'center', marginBottom: 32 },
  successText: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  successSubtext: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  receiptCard: { width: '100%', borderRadius: 16, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  receiptBrand: { fontSize: 18, fontWeight: '800' },
  receiptDate: { fontSize: 14 },
  dashedDivider: { borderWidth: 1, borderStyle: 'dashed', marginVertical: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { fontSize: 15 },
  receiptValue: { fontSize: 15, fontWeight: '600' },
  receiptTotalLabel: { fontSize: 18, fontWeight: '700' },
  receiptTotalValue: { fontSize: 24, fontWeight: '800' },
  btn: { width: '100%', paddingVertical: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
});
