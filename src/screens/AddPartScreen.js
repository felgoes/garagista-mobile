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
import { createPart } from '../services/parts';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import {
  maskKm,
  parseKm,
  maskCurrency,
  parseCurrency,
  currencyToRaw,
  maskDate,
  parseDate,
  getDateInputState,
} from '../utils/masks';

function todayStr() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
}

const DEFAULT_INTERVALS = {
  motor: 10000,
  oleo: 5000,
  corrente: 20000,
  pneus: 30000,
  freio_d: 20000,
  freio_t: 20000,
  freio: 20000,
  bateria: 40000,
  filtro: 10000,
  vela: 20000,
  embreagem: 30000,
  cambio: 50000,
  suspensao: 40000,
};

export default function AddPartScreen({ route, navigation }) {
  const { vehicle, slot } = route.params;

  const interval = DEFAULT_INTERVALS[slot?.key];
  const defaultNextKm = interval ? String(vehicle.current_km + interval) : '';

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [installedKm, setInstalledKm] = useState(String(vehicle.current_km));
  const [installedDate, setInstalledDate] = useState(todayStr());
  const [nextKm, setNextKm] = useState(defaultNextKm);
  const [nextDate, setNextDate] = useState('');
  const [costRaw, setCostRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const installedDateState = getDateInputState(installedDate);
  const nextDateState = getDateInputState(nextDate, { optional: true });

  const isDirty = !!(name || brand || costRaw);
  const { markSaved } = useUnsavedChanges(navigation, isDirty);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome da peça.');
      return;
    }
    if (!installedKm || parseKm(installedKm) <= 0) {
      Alert.alert('Atenção', 'Informe o KM corretamente.');
      return;
    }
    const parsedDate = parseDate(installedDate);
    if (installedDate.trim() && !parsedDate) {
      Alert.alert('Atenção', 'Data inválida.\nUse o formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    try {
      const parsedNextDate = parseDate(nextDate);
      if (nextDate.trim() && !parsedNextDate) {
        Alert.alert('Atenção', 'Data de vencimento inválida. Use DD/MM/AAAA.');
        setSaving(false);
        return;
      }
      await createPart(vehicle.id, {
        slot: slot?.key || null,
        name: name.trim(),
        brand: brand.trim() || null,
        installed_km: parseKm(installedKm),
        installed_date: parsedDate,
        next_km: nextKm ? parseKm(nextKm) : null,
        next_date: parsedNextDate,
        cost: costRaw ? parseCurrency(costRaw) : null,
      });
      markSaved();
      navigation.goBack();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao salvar peça.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>{slot?.label || 'Nova Peça'}</Text>
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
          <View style={styles.contextRow}>
            <Text style={styles.vehicleName}>
              {vehicle.brand.name} {vehicle.model.name} {vehicle.year}
            </Text>
            {slot?.label && (
              <View style={styles.slotBadge}>
                <MaterialCommunityIcons name={slot.icon || 'tag'} size={12} color="#2563eb" />
                <Text style={styles.slotBadgeText}>{slot.label}</Text>
              </View>
            )}
          </View>


          <Text style={styles.label}>Nome da peça</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Óleo Motul 10W40"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Marca</Text>
          <TextInput
            style={styles.input}
            placeholder="Opcional"
            value={brand}
            onChangeText={setBrand}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>KM de instalação</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 15.000"
                value={maskKm(installedKm)}
                onChangeText={(v) => setInstalledKm(v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Data</Text>
              <TextInput
                style={[styles.input, installedDateState.invalid && styles.inputError]}
                placeholder="DD/MM/AAAA"
                value={installedDate}
                onChangeText={(value) => setInstalledDate(maskDate(value))}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text
                style={[
                  styles.helperText,
                  installedDateState.tone === 'error' && styles.helperTextError,
                  installedDateState.tone === 'success' && styles.helperTextSuccess,
                ]}
              >
                {installedDateState.message}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Trocar na KM</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 20.000"
                value={maskKm(nextKm)}
                onChangeText={(v) => setNextKm(v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Vence em (data)</Text>
              <TextInput
                style={[styles.input, nextDateState.invalid && styles.inputError]}
                placeholder="DD/MM/AAAA (opcional)"
                value={nextDate}
                onChangeText={(value) => setNextDate(maskDate(value))}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text
                style={[
                  styles.helperText,
                  nextDateState.tone === 'error' && styles.helperTextError,
                  nextDateState.tone === 'success' && styles.helperTextSuccess,
                ]}
              >
                {nextDateState.message}
              </Text>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Custo (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={costRaw ? maskCurrency(costRaw) : ''}
                onChangeText={(v) => setCostRaw(v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveBtn}
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
    padding: 24,
    paddingTop: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  content: { padding: 24, paddingTop: 0, paddingBottom: 16 },
  contextRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  slotBadgeText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  helperTextError: {
    color: '#dc2626',
  },
  helperTextSuccess: {
    color: '#16a34a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
