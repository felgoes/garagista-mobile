import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createFuelLog } from '../services/fuelLogs';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { maskKm, parseKm, maskCurrency, parseCurrency, maskLiters, parseLiters } from '../utils/masks';

function todayStr() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
}

function parseDate(str) {
  const [d, m, y] = str.split('/');
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}


function consumptionColor(kmL) {
  if (kmL >= 20) return '#16a34a';
  if (kmL >= 14) return '#2563eb';
  if (kmL >= 10) return '#d97706';
  return '#dc2626';
}

function consumptionLabel(kmL) {
  if (kmL >= 20) return 'Excelente';
  if (kmL >= 14) return 'Bom';
  if (kmL >= 10) return 'Regular';
  return 'Ruim';
}

export default function AddFuelLogScreen({ route, navigation }) {
  const { vehicle } = route.params;

  const [date, setDate] = useState(todayStr());
  const [kmDriven, setKmDriven] = useState('');
  const [litersRaw, setLitersRaw] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [fullTank, setFullTank] = useState(true);
  const [saving, setSaving] = useState(false);

  const liters = parseLiters(litersRaw);
  const price = parseCurrency(priceRaw);
  const kmNum = parseInt(kmDriven, 10) || 0;
  const total = liters > 0 && price > 0 ? liters * price : 0;
  const consumption = fullTank && kmNum > 0 && liters > 0 ? kmNum / liters : null;

  const isDirty = !!(kmDriven || litersRaw || priceRaw);
  const { markSaved } = useUnsavedChanges(navigation, isDirty);

  async function handleSave() {
    if (!kmDriven || kmNum <= 0) {
      Alert.alert('Atenção', 'Informe quantos km você rodou neste tanque.');
      return;
    }
    if (liters <= 0) {
      Alert.alert('Atenção', 'Informe a quantidade de litros.');
      return;
    }
    if (price <= 0) {
      Alert.alert('Atenção', 'Informe o preço por litro.');
      return;
    }
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      Alert.alert('Atenção', 'Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    try {
      await createFuelLog(vehicle.id, {
        date: parsedDate,
        km: kmNum,
        liters,
        price_per_liter: price,
        total_cost: total,
        full_tank: fullTank,
      });
      markSaved();
      navigation.goBack();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao salvar abastecimento.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }

  const color = consumption ? consumptionColor(consumption) : '#2563eb';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="gas-station" size={20} color="#2563eb" />
          <Text style={styles.title}>Abastecimento</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.vehicleName}>
            {vehicle.brand.name} {vehicle.model.name} {vehicle.year}
          </Text>

          {/* KM rodados — campo principal */}
          <View style={styles.kmCard}>
            <Text style={styles.kmLabel}>KM rodados neste tanque</Text>
            <View style={styles.kmInputRow}>
              <TextInput
                style={styles.kmInput}
                placeholder="0"
                placeholderTextColor="#cbd5e1"
                value={maskKm(kmDriven)}
                onChangeText={(v) => setKmDriven(v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
              <Text style={styles.kmUnit}>km</Text>
            </View>
          </View>

          {/* Litros + Tanque cheio */}
          <View style={styles.row}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Litros</Text>
              <View style={styles.maskedInputRow}>
                <TextInput
                  style={styles.maskedInput}
                  placeholder="0,0"
                  placeholderTextColor="#cbd5e1"
                  value={litersRaw}
                  onChangeText={(v) => setLitersRaw(maskLiters(v))}
                  keyboardType="numeric"
                />
                <Text style={styles.inputSuffix}>L</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.tankToggle, fullTank && styles.tankToggleActive]}
              onPress={() => setFullTank((v) => !v)}
            >
              <MaterialCommunityIcons
                name={fullTank ? 'water' : 'water-outline'}
                size={18}
                color={fullTank ? '#fff' : '#94a3b8'}
              />
              <Text style={[styles.tankToggleText, fullTank && styles.tankToggleTextActive]}>
                Cheio
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preço por litro */}
          <Text style={styles.fieldLabel}>Preço por litro</Text>
          <View style={styles.maskedInputRow}>
            <Text style={styles.inputPrefix}>R$</Text>
            <TextInput
              style={[styles.maskedInput, { flex: 1 }]}
              placeholder="0,00"
              placeholderTextColor="#cbd5e1"
              value={priceRaw}
              onChangeText={(v) => setPriceRaw(maskCurrency(v))}
              keyboardType="numeric"
            />
          </View>

          {/* Total calculado */}
          {total > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                R$ {total.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          )}

          {/* Consumo em destaque */}
          {consumption && (
            <View style={[styles.consumptionCard, { borderColor: color }]}>
              <View style={[styles.consumptionIconBg, { backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consumptionValue, { color }]}>
                  {consumption.toFixed(1).replace('.', ',')} km/L
                </Text>
                <Text style={[styles.consumptionBadge, { color }]}>
                  {consumptionLabel(consumption)}
                </Text>
              </View>
            </View>
          )}

          {/* Data (menos destaque) */}
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Data</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="DD/MM/AAAA"
            value={date}
            onChangeText={setDate}
            keyboardType="numeric"
            maxLength={10}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: color }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#111' },
  content: { padding: 24, paddingTop: 0, paddingBottom: 16 },
  vehicleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 20,
  },

  // KM card
  kmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  kmLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  kmInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  kmInput: {
    fontSize: 52,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  kmUnit: { fontSize: 20, fontWeight: '600', color: '#94a3b8', paddingBottom: 6 },

  // Row com litros + toggle
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 4 },
  fieldBlock: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  maskedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  maskedInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#0f172a' },
  inputSuffix: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginLeft: 4 },
  inputPrefix: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginRight: 6 },

  // Tank toggle
  tankToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 0,
    height: 52,
  },
  tankToggleActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tankToggleText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  tankToggleTextActive: { color: '#fff' },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#2563eb' },

  // Consumption
  consumptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
  },
  consumptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumptionValue: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  consumptionBadge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Date (menos destaque)
  dateInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#475569',
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
