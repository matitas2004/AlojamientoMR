import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, isAuthenticated } = useAuth();

  const { id, habitacionId, precioNoche, noches, alojamientoNombre } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Validaciones
  const pNoche = Number(precioNoche) || 0;
  const numNoches = Number(noches) || 1;
  const subtotal = pNoche * numNoches;
  const impuestos = subtotal * 0.15; // 15%
  const total = subtotal + impuestos;

  const handlePagar = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3) {
      Alert.alert('Error', 'Por favor ingresa datos de tarjeta válidos (simulados).');
      return;
    }

    setLoading(true);

    try {
      // 1. Fechas calculadas a partir de hoy (para la demo)
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 1 + numNoches);

      // 2. Crear Reserva
      const reserva = await api.crearReserva({
        clienteId: user?.usuarioId || user?.clienteId || 1,
        alojamientoId: Number(id),
        fechaCheckIn: checkIn.toISOString().split('T')[0],
        fechaCheckOut: checkOut.toISOString().split('T')[0],
        numAdultos: 2,
        numNinos: 0,
        llevaMascotas: false,
        habitaciones: [{
          habitacionId: Number(habitacionId),
          numNoches: numNoches,
          precioPorNoche: pNoche
        }]
      });

      // Obtener el ID/Código de la reserva que nos devolvió el backend
      const resId = reserva.reservaId;
      const resCodigo = reserva.codigoReserva || `RES-${resId}`;

      // 3. Crear Factura explícita
      try {
        await api.crearFactura({
          reservaId: resId,
          fechaEmision: new Date().toISOString().split('T')[0],
          monto: total, // Pasamos el monto explícito para evitar el bug de monto 0
          metodoPagoId: 1 // Tarjeta
        });
      } catch (fErr) {
        // Si la factura falla por la comunicación síncrona o asíncrona, avanzamos igual
        console.warn('Factura creation backgrounded or failed', fErr);
      }

      Alert.alert('¡Pago Exitoso!', 'Tu reserva ha sido confirmada.');
      // Ir al recibo / factura usando replace para que no vuelva atrás al checkout
      router.replace({ pathname: `/factura/${resId}`, params: { totalFallback: total } } as any);

    } catch (err: any) {
      Alert.alert('Error', 'Hubo un problema al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Confirmar y Pagar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen de tu reserva</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.alojamientoName, { color: colors.text }]}>{alojamientoNombre || 'Alojamiento'}</Text>
          <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
            Habitación: {habitacionId}
          </Text>
          <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
            Duración: {numNoches} noche(s)
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Detalle del Precio</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.priceText, { color: colors.textSecondary }]}>
              ${pNoche.toFixed(2)} x {numNoches} noches
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.priceText, { color: colors.textSecondary }]}>Impuestos (15%)</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>${impuestos.toFixed(2)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.totalText, { color: colors.text }]}>Total a Pagar</Text>
            <Text style={[styles.totalValue, { color: colors.primaryDark }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Método de Pago</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Número de Tarjeta</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={16}
              value={cardNumber}
              onChangeText={setCardNumber}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Vencimiento</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="MM/YY"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
                value={expiry}
                onChangeText={setExpiry}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="123"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={3}
                value={cvv}
                onChangeText={setCvv}
              />
            </View>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
            * Esto es una simulación. No ingreses datos reales.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.payBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handlePagar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>Pagar ${total.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: { padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  alojamientoName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  detailsText: { fontSize: 14, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceText: { fontSize: 15 },
  priceValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  totalText: { fontSize: 18, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 32, borderTopWidth: 1 },
  payBtn: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
