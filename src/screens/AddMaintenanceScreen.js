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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createMaintenance } from '../services/maintenances';
import { createPart } from '../services/parts';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import {
  maskKm,
  parseKm,
  maskCurrency,
  parseCurrency,
  maskDate,
  parseDate,
  getDateInputState,
} from '../utils/masks';

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

const TYPE_AUTO_PARTS = {
  'Troca de Óleo': [
    { slot: 'oleo', name: 'Óleo Motor' },
    { slot: 'filtro', name: 'Filtro de Óleo' },
  ],
  'Freios': [
    { slot: 'freio_d', name: 'Pastilha Dianteira' },
    { slot: 'freio_t', name: 'Pastilha Traseira' },
    { slot: 'freio', name: 'Pastilha de Freio' },
  ],
  'Pneus': [
    { slot: 'pneus', name: 'Pneu' },
  ],
  'Correia Dentada': [
    { slot: 'corrente', name: 'Corrente/Correia' },
  ],
  'Filtro de Ar': [
    { slot: 'filtro', name: 'Filtro de Ar' },
  ],
  'Vela': [
    { slot: 'vela', name: 'Vela de Ignição' },
  ],
  'Suspensão': [
    { slot: 'suspensao', name: 'Amortecedor' },
  ],
};

const SLOTS_BY_TYPE = {
  moto: [
    { key: 'motor', label: 'Motor' },
    { key: 'oleo', label: 'Óleo' },
    { key: 'corrente', label: 'Corrente' },
    { key: 'embreagem', label: 'Embreagem' },
    { key: 'pneus', label: 'Pneus' },
    { key: 'freio_d', label: 'Freio D.' },
    { key: 'freio_t', label: 'Freio T.' },
    { key: 'bateria', label: 'Bateria' },
    { key: 'filtro', label: 'Filtro Ar' },
    { key: 'vela', label: 'Vela' },
  ],
  carro: [
    { key: 'motor', label: 'Motor' },
    { key: 'oleo', label: 'Óleo' },
    { key: 'cambio', label: 'Câmbio' },
    { key: 'suspensao', label: 'Suspensão' },
    { key: 'pneus', label: 'Pneus' },
    { key: 'freio', label: 'Freios' },
    { key: 'bateria', label: 'Bateria' },
    { key: 'filtro', label: 'Filtro Ar' },
  ],
  caminhao: [
    { key: 'motor', label: 'Motor' },
    { key: 'oleo', label: 'Óleo' },
    { key: 'pneus', label: 'Pneus' },
    { key: 'freio', label: 'Freios' },
    { key: 'bateria', label: 'Bateria' },
    { key: 'filtro', label: 'Filtro Ar' },
    { key: 'embreagem', label: 'Embreagem' },
    { key: 'suspensao', label: 'Suspensão' },
  ],
};

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

// Validade em meses por slot (peças com prazo de validade independente do km)
const DEFAULT_EXPIRY_MONTHS = {
  oleo: 12,       // óleo degrada em 1 ano mesmo sem usar
  filtro: 12,     // filtro de óleo/ar junto com a troca
  corrente: 36,   // corrente/correia: 3 anos
  pneus: 60,      // pneus: 5 anos (ABNT NBR 15582 recomenda substituição)
  bateria: 24,    // bateria: 2 anos de vida útil média
  vela: 24,       // vela de ignição: 2 anos
  freio_d: 24,    // pastilha dianteira: 2 anos
  freio_t: 24,    // pastilha traseira: 2 anos
  freio: 24,      // pastilha (carro): 2 anos
  suspensao: 36,  // amortecedor: 3 anos
  embreagem: 48,  // disco de embreagem: 4 anos
};

function todayStr() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
}

function addMonths(dateStr, months) {
  const [d, m, y] = dateStr.split('/');
  const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  dt.setMonth(dt.getMonth() + months);
  return [
    String(dt.getDate()).padStart(2, '0'),
    String(dt.getMonth() + 1).padStart(2, '0'),
    dt.getFullYear(),
  ].join('/');
}

export default function AddMaintenanceScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const slots = SLOTS_BY_TYPE[vehicle.vehicle_type] || SLOTS_BY_TYPE.carro;

  // Step 1
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [customType, setCustomType] = useState('');
  const [date, setDate] = useState(todayStr());
  const [km, setKm] = useState(String(vehicle.current_km)); // raw digits
  const [costRaw, setCostRaw] = useState('');
  const [description, setDescription] = useState('');

  // Step 2
  const [parts, setParts] = useState([]);
  const [slotPicker, setSlotPicker] = useState(null);
  const [saving, setSaving] = useState(false);
  const dateState = getDateInputState(date);

  const isDirty = !!(selectedTypes.length || customType || costRaw || description || parts.length > 0);
  const { markSaved } = useUnsavedChanges(navigation, isDirty);

  function toggleType(t) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function goToStep2() {
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
    if (kmNum < vehicle.current_km) {
      Alert.alert(
        'Atenção',
        `KM não pode ser menor que o atual (${vehicle.current_km.toLocaleString('pt-BR')} km).`
      );
      return;
    }
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      Alert.alert('Atenção', 'Data inválida.\nUse o formato DD/MM/AAAA.');
      return;
    }

    // Gerar peças sugeridas a partir dos tipos selecionados
    const generated = [];
    for (const t of selectedTypes) {
      const suggested = (TYPE_AUTO_PARTS[t] || []).filter((ap) =>
        slots.some((s) => s.key === ap.slot)
      );
      for (const ap of suggested) {
        // evitar duplicatas do mesmo slot
        if (!generated.some((g) => g.slot === ap.slot)) {
          const interval = DEFAULT_INTERVALS[ap.slot];
          const expiryMonths = DEFAULT_EXPIRY_MONTHS[ap.slot];
          generated.push({
            id: Date.now() + Math.random(),
            slot: ap.slot,
            slotLabel: slots.find((s) => s.key === ap.slot)?.label || ap.slot,
            name: ap.name,
            nextKm: interval ? String(kmNum + interval) : '',
            nextDate: expiryMonths ? addMonths(date, expiryMonths) : '',
          });
        }
      }
    }
    setParts(generated);
    setStep(2);
  }

  function addPart() {
    setParts((prev) => [
      ...prev,
      { id: Date.now(), slot: null, slotLabel: null, name: '', nextKm: '', nextDate: '' },
    ]);
  }

  function updatePart(id, field, value) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function removePart(id) {
    setParts((prev) => prev.filter((p) => p.id !== id));
  }

  function confirmSlot(slot) {
    const interval = DEFAULT_INTERVALS[slot.key];
    const expiryMonths = DEFAULT_EXPIRY_MONTHS[slot.key];
    const kmNum = parseKm(km) || vehicle.current_km;
    setParts((prev) =>
      prev.map((p) =>
        p.id === slotPicker.partId
          ? {
              ...p,
              slot: slot.key,
              slotLabel: slot.label,
              nextKm: interval ? String(kmNum + interval) : p.nextKm,
              nextDate: expiryMonths ? addMonths(date, expiryMonths) : p.nextDate,
            }
          : p
      )
    );
    setSlotPicker(null);
  }

  function buildTypeStr() {
    return [
      ...selectedTypes.filter((t) => t !== 'Outro'),
      ...(selectedTypes.includes('Outro') && customType.trim() ? [customType.trim()] : []),
    ].join(', ');
  }

  async function handleSave() {
    const typeStr = buildTypeStr();
    const kmNum = parseKm(km);
    const parsedDate = parseDate(date);
    const validParts = parts.filter((p) => p.name.trim());

    for (const p of validParts) {
      if (p.nextKm && parseKm(p.nextKm) <= kmNum) {
        Alert.alert(
          'Atenção',
          `A próxima KM de "${p.name}" deve ser maior que a KM da manutenção.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      await createMaintenance(vehicle.id, {
        type: typeStr,
        date: parsedDate,
        km: kmNum,
        cost: costRaw ? parseCurrency(costRaw) : null,
        description: description.trim() || null,
      });

      await Promise.all(
        validParts.map((p) =>
          createPart(vehicle.id, {
            slot: p.slot || null,
            name: p.name.trim(),
            installed_km: kmNum,
            installed_date: parsedDate,
            next_km: p.nextKm ? parseKm(p.nextKm) : null,
            next_date: parseDate(p.nextDate || ''),
          })
        )
      );

      markSaved();
      navigation.goBack();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao salvar manutenção.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }

  // ─── Slot picker modal ───────────────────────────────────────────────────
  const slotPickerModal = (
    <Modal
      visible={!!slotPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setSlotPicker(null)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setSlotPicker(null)}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tipo da peça</Text>
            <FlatList
              data={slots}
              keyExtractor={(s) => s.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => confirmSlot(item)}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                  {DEFAULT_INTERVALS[item.key] && (
                    <Text style={styles.modalOptionHint}>
                      +{DEFAULT_INTERVALS[item.key].toLocaleString('pt-BR')} km
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // ─── Step 1 ───────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Nova Manutenção</Text>
            <Text style={styles.stepLabel}>Passo 1 de 2</Text>
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
                  style={[styles.input, dateState.invalid && styles.inputError]}
                  placeholder="DD/MM/AAAA"
                  value={date}
                  onChangeText={(value) => setDate(maskDate(value))}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text
                  style={[
                    styles.helperText,
                    dateState.tone === 'error' && styles.helperTextError,
                    dateState.tone === 'success' && styles.helperTextSuccess,
                  ]}
                >
                  {dateState.message}
                </Text>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>KM atual</Text>
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
            <TouchableOpacity style={styles.nextBtn} onPress={goToStep2}>
              <Text style={styles.nextBtnText}>Próximo: Peças</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Step 2 ───────────────────────────────────────────────────────────────
  const typeStr = buildTypeStr();
  const kmNum = parseKm(km);

  return (
    <SafeAreaView style={styles.container}>
      {slotPickerModal}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Peças trocadas</Text>
          <Text style={styles.stepLabel}>Passo 2 de 2</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Resumo do passo 1 */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="wrench-outline" size={14} color="#2563eb" />
          <Text style={styles.summaryText} numberOfLines={1}>{typeStr}</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="speedometer" size={14} color="#64748b" />
          <Text style={styles.summaryText}>{kmNum.toLocaleString('pt-BR')} km</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.summaryText}>{date}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.partsHeader}>
            <Text style={styles.partsTitle}>
              {parts.length > 0 ? `${parts.length} peça(s)` : 'Nenhuma peça'}
            </Text>
            <TouchableOpacity style={styles.addPartBtn} onPress={addPart}>
              <MaterialCommunityIcons name="plus" size={16} color="#2563eb" />
              <Text style={styles.addPartText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {parts.length === 0 && (
            <View style={styles.emptyParts}>
              <MaterialCommunityIcons name="package-variant-closed" size={32} color="#ddd" />
              <Text style={styles.emptyPartsText}>
                Nenhuma peça sugerida para os tipos selecionados.{'\n'}Toque em Adicionar para incluir manualmente.
              </Text>
            </View>
          )}

          {parts.map((p, index) => {
            const nextDateState = getDateInputState(p.nextDate, { optional: true });
            return (
            <View key={p.id} style={styles.partCard}>
              <View style={styles.partCardHeader}>
                <Text style={styles.partCardIndex}>#{index + 1}</Text>
                <TouchableOpacity
                  style={[styles.slotPicker, p.slot && styles.slotPickerSelected]}
                  onPress={() => setSlotPicker({ partId: p.id })}
                >
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={13}
                    color={p.slot ? '#2563eb' : '#94a3b8'}
                  />
                  <Text style={[styles.slotPickerText, p.slot && styles.slotPickerTextSelected]}>
                    {p.slotLabel || 'Tipo'}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={13}
                    color={p.slot ? '#2563eb' : '#94a3b8'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removePart(p.id)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color="#ccc" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Nome da peça"
                value={p.name}
                onChangeText={(v) => updatePart(p.id, 'name', v)}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partFieldLabel}>Próx. KM</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 20.000"
                    value={maskKm(p.nextKm)}
                    onChangeText={(v) => updatePart(p.id, 'nextKm', v.replace(/\D/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.partFieldLabel}>Vence em</Text>
                  <TextInput
                    style={[styles.input, nextDateState.invalid && styles.inputError]}
                    placeholder="DD/MM/AAAA"
                    value={p.nextDate}
                    onChangeText={(value) => updatePart(p.id, 'nextDate', maskDate(value))}
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
              </View>
            </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Salvando...' : 'Salvar manutenção'}
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
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 17, fontWeight: 'bold', color: '#111' },
  stepLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
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

  // Summary bar (step 2 header)
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  summaryText: { fontSize: 12, color: '#475569', fontWeight: '500', flexShrink: 1 },
  summarySep: { width: 1, height: 16, backgroundColor: '#e2e8f0' },

  // Parts
  partsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partsTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  addPartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addPartText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  emptyParts: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyPartsText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  partCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  partCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partCardIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    width: 20,
  },
  slotPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  slotPickerSelected: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  slotPickerText: { flex: 1, fontSize: 12, color: '#94a3b8' },
  slotPickerTextSelected: { color: '#2563eb', fontWeight: '600' },
  removeBtn: { padding: 2 },
  partFieldLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4, marginTop: 2 },

  // Footer buttons
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8fafc',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: '#1d4ed8',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalOptionText: { fontSize: 15, color: '#111' },
  modalOptionHint: { fontSize: 12, color: '#94a3b8' },
});
