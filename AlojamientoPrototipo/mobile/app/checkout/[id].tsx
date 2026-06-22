import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import { Reservas, Facturas } from '@/lib/api';

const DARK = { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', textSecondary: '#94A3B8', primary: '#3B82F6', success: '#10B981' };
const LIGHT = { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSecondary: '#64748B', primary: '#2563EB', success: '#059669' };

function PriceRow({ label, value, bold, C }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, { color: bold ? C.text : C.textSecondary }, bold && { fontWeight: '700', fontSize: 16 }]}>
        {label}
      </Text>
      <Text style={[styles.priceValue, { color: bold ? C.primary : C.text }, bold && { fontSize: 20, fontWeight: '800' }]}>
        {value}
      </Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { id, habitacionId, precioNoche, noches, alojamientoNombre } = useLocalSearchParams();
  const scheme = useColorScheme() ?? 'light';
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();

  const pNoche = Number(precioNoche) || 0;
  const numNoches = Number(noches) || 2;
  const subtotal = pNoche * numNoches;
  const impuestos = subtotal * 0.15;
  const total = subtotal + impuestos;

  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePagar = async () => {
    if (card.length < 16 || expiry.length < 5 || cvv.length < 3) {
      Alert.alert('Datos incompletos', 'Por favor ingresa los datos de la tarjeta (simulados).');
      return;
    }
    setLoading(true);
    try {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 1 + numNoches);

      // 1. Crear reserva
      const resRes = await Reservas.crear({
        clienteId: user?.clienteId ?? user?.usuarioId ?? 1,
        alojamientoId: Number(id),
        fechaCheckIn: checkIn.toISOString().split('T')[0],
        fechaCheckOut: checkOut.toISOString().split('T')[0],
        numAdultos: 2,
        numNinos: 0,
        llevaMascotas: false,
        habitaciones: [{
          habitacionId: Number(habitacionId),
          numNoches: numNoches,
          precioPorNoche: pNoche,
        }],
      });

      const reservaId = resRes.data?.reservaId ?? resRes.data?.value?.reservaId;

      // 2. Crear factura
      try {
        await Facturas.crear({
          reservaId: Number(reservaId),
          monto: total,
          metodoPagoId: 1,
          detalles: [{
            descripcion: `Estadía en ${alojamientoNombre || 'Alojamiento'} - Habitación #${habitacionId}`,
            cantidad: numNoches,
            precioUnitario: pNoche,
          }]
        });
      } catch (_) {
        // Si falla la factura, continuamos al recibo con el total calculado localmente
      }

      router.replace({
        pathname: `/factura/${reservaId}`,
        params: { totalFallback: total, alojamientoNombre },
      } as any);

    } catch (err) {
      Alert.alert('Error', err.friendlyMessage || 'No se pudo procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Confirmar y Pagar</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumen */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Tu Reserva</Text>
          <Text style={[styles.alojNombre, { color: C.primary }]}>{alojamientoNombre || 'Alojamiento'}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="bed-outline" size={16} color={C.textSecondary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>Hab. #{habitacionId}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="moon-outline" size={16} color={C.textSecondary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>{numNoches} noches</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={C.textSecondary} />
              <Text style={[styles.infoText, { color: C.textSecondary }]}>Mañana → {numNoches + 1}d</Text>
            </View>
          </View>
        </View>

        {/* Precios */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Desglose</Text>
          <PriceRow label={`$${pNoche.toFixed(2)} × ${numNoches} noches`} value={`$${subtotal.toFixed(2)}`} C={C} />
          <PriceRow label="Impuestos (15% IVA)" value={`$${impuestos.toFixed(2)}`} C={C} />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <PriceRow label="Total a pagar" value={`$${total.toFixed(2)}`} bold C={C} />
        </View>

        {/* Tarjeta (simulada) */}
        <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Método de Pago</Text>
          <View style={[styles.cardSimNote, { backgroundColor: `${C.primary}15` }]}>
            <Ionicons name="information-circle-outline" size={16} color={C.primary} />
            <Text style={[styles.simNoteText, { color: C.primary }]}>
              Ingresa datos de prueba (no reales)
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: C.text }]}>Número de Tarjeta</Text>
          <View style={[styles.inputBox, { borderColor: C.border, backgroundColor: C.bg }]}>
            <Ionicons name="card-outline" size={18} color={C.textSecondary} style={{ paddingLeft: 12 }} />
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={C.textSecondary}
              keyboardType="number-pad"
              maxLength={16}
              value={card}
              onChangeText={setCard}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: C.text }]}>Vencimiento</Text>
              <View style={[styles.inputBox, { borderColor: C.border, backgroundColor: C.bg }]}>
                <TextInput
                  style={[styles.input, { color: C.text, paddingLeft: 14 }]}
                  placeholder="MM/YY"
                  placeholderTextColor={C.textSecondary}
                  maxLength={5}
                  value={expiry}
                  onChangeText={setExpiry}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: C.text }]}>CVV</Text>
              <View style={[styles.inputBox, { borderColor: C.border, backgroundColor: C.bg }]}>
                <TextInput
                  style={[styles.input, { color: C.text, paddingLeft: 14 }]}
                  placeholder="123"
                  placeholderTextColor={C.textSecondary}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={cvv}
                  onChangeText={setCvv}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.bottomBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: C.primary }, loading && { opacity: 0.7 }]}
          onPress={handlePagar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.payText}>Pagar ${total.toFixed(2)}</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  alojNombre: { fontSize: 16, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 13 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  priceLabel: { fontSize: 14, color: '#64748B' },
  priceValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  cardSimNote: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, marginBottom: 4 },
  simNoteText: { fontSize: 12, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1.5, borderRadius: 10 },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 15, height: '100%' },
  row: { flexDirection: 'row', gap: 12 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, borderTopWidth: 1 },
  payBtn: { height: 56, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  payText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
