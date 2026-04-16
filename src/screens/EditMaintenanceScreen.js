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
import { updateMaintenance } from '../services/maintenances';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { maskKm, parseKm, maskCurrency, parseCurrency, currencyToRaw } from '../utils/masks';

const TYPES = [
  'Troca de Óleo',
  'Revisão Geral',
  'Freios',
  'Pneus',
  'Correia Dentada',
  'Filtro de Ar',
  'Vela',
  'Alinhamento',
  'Suspensão',
  'Outro',
];

function isoToDisplay(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function parseDate(str) {
  if (!str || !str.trim()) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m}-${d}`;
}

function parseSelectedTypes(typeStr) {
  if (!typeStr) return { selected: [], custom: '' };
  const parts = typeStr.split(', ');
  const known = parts.filter((t) => TYPES.includes(t));
  const unknown = parts.filter((t) => !TYPES.includes(t));
  const selected = known.slice();
  let custom = '';
  if (unknown.length > 0) {
    selected.push('Outro');
    custom = unknown.join(', ');
  }
  return { selected, custom };
}

export default function EditMaintenanceScreen({ route, navigation }) {
  const { vehicle, maintenance } = route.params;

  const { selected: initTypes, custom: initCustom } = parseSelectedTypes(maintenance.type);

  const [selectedTypes, setSelectedTypes] = useState(initTypes);
  const [customType, setCustomType] = useState(initCustom);
  const [date, setDate] = useState(isoToDisplay(maintenance.date));
  const [km, setKm] = useState(String(maintenance.km)); // raw digits
  const [costRaw, setCostRaw] = useState(currencyToRaw(maintenance.cost));
  const [description, setDescription] = useState(maintenance.description || '');
  const [saving, setSaving] = useState(false);

  const initialDate = isoToDisplay(maintenance.date);
  const initialKm = String(maintenance.km);
  const initialCostRaw = currencyToRaw(maintenance.cost);
  const initialDescription = maintenance.description || '';
  const isDirty =
    JSON.stringify(selectedTypes) !== JSON.stringify(initTypes) ||
    customType !== initCustom ||
    date !== initialDate ||
    km !== initialKm ||
    costRaw !== initialCostRaw ||
    description !== initialDescription;

  const { markSaved } = useUnsavedChanges(navigation, isDirty);

  function toggleType(t) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function buildTypeStr() {
    return [
      ...selectedTypes.filter((t) => t !== 'Outro'),
      ...(selectedTypes.includes('Outro') && customType.trim() ? [customType.trim()] : []),
    ].join(', ');
  }

  async function handleSave() {
    const typeStr = buildTypeStr();
    if (!typeStr) {
      Alert.alert('Atenção', 'Selecione pelo menos um tipo de manutenção.');
      return;
    }
    const kmNum = parseKm(km);
    if (!km || kmNum <= 0) {
      Alert.alert('Atenção', 'Informe o KM corretamente.');
      return;
    }
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      Alert.alert('Atenção', 'Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    try {
      await updateMaintenance(vehicle.id, maintenance.id, {
        type: typeStr,
        date: parsedDate,
        km: kmNum,
        cost: costRaw ? parseCurrency(costRaw) : null,
        description: description.trim() || null,
      });
      markSaved();
      navigation.goBack();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao salvar manutenção.';
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
        <Text style={styles.title}>Editar Manutenção</Text>
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

          <Text style={styles.sectionTitle}>O que foi feito?</Text>
          <View style={styles.chipsWrap}>
            {TYPES.map((t) => {
              const active = selectedTypes.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleType(t)}
                >
                  {active && (
                    <MaterialCommunityIcons name="check" size={12} color="#2563eb" />
                  )}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedTypes.includes('Outro') && (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Descreva o tipo de manutenção"
              value={customType}
              onChangeText={setCustomType}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Data</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                value={date}
                onChangeText={setDate}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>KM</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 15.000"
                value={maskKm(km)}
                onChangeText={(v) => setKm(v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Custo total (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            value={costRaw ? maskCurrency(costRaw) : ''}
            onChangeText={(v) => setCostRaw(v.replace(/\D/g, ''))}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Opcional"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
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
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#111' },
  content: { padding: 20, paddingTop: 8, paddingBottom: 16 },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
  },
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
  textarea: { height: 80 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#2563eb', fontWeight: '700' },
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
