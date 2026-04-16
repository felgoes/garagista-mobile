import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBrands, getModels } from '../services/brands';
import { createVehicle } from '../services/vehicles';
import SearchSelect from '../components/SearchSelect';
import { maskKm, parseKm } from '../utils/masks';

const VEHICLE_TYPES = [
  { label: 'Carro', value: 'carro', icon: 'car' },
  { label: 'Moto', value: 'moto', icon: 'motorbike' },
  { label: 'Caminhão', value: 'caminhao', icon: 'truck' },
];

export default function AddVehicleScreen({ navigation }) {
  const [vehicleType, setVehicleType] = useState(null);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vehicleType) return;
    setSelectedBrand(null);
    setSelectedModel(null);
    setModels([]);
    setLoadingBrands(true);
    getBrands(vehicleType)
      .then(setBrands)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar as marcas'))
      .finally(() => setLoadingBrands(false));
  }, [vehicleType]);

  useEffect(() => {
    if (!selectedBrand) return;
    setSelectedModel(null);
    setLoadingModels(true);
    getModels(selectedBrand.id)
      .then(setModels)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os modelos'))
      .finally(() => setLoadingModels(false));
  }, [selectedBrand]);

  async function handleSave() {
    if (!vehicleType || !selectedBrand || !selectedModel || !year) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }
    if (isNaN(Number(year)) || year.length !== 4) {
      Alert.alert('Erro', 'Ano inválido');
      return;
    }
    setSaving(true);
    try {
      await createVehicle({
        vehicle_type: vehicleType,
        brand_id: selectedBrand.id,
        model_id: selectedModel.id,
        year: Number(year),
        plate: plate || null,
        current_km: parseKm(currentKm),
      });
      navigation.goBack();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao salvar veículo';
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
        <Text style={styles.title}>Novo veículo</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
        {/* Tipo */}
        <Text style={styles.label}>Tipo *</Text>
        <View style={styles.typeRow}>
          {VEHICLE_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[
                styles.typeBtn,
                vehicleType === t.value && styles.typeBtnActive,
              ]}
              onPress={() => setVehicleType(t.value)}
            >
              <MaterialCommunityIcons
                name={t.icon}
                size={24}
                color={vehicleType === t.value ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  vehicleType === t.value && styles.typeBtnTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Marca */}
        {vehicleType && (
          <>
            <Text style={styles.label}>Marca *</Text>
            {loadingBrands ? (
              <ActivityIndicator color="#2563eb" style={{ marginBottom: 16 }} />
            ) : (
              <SearchSelect
                items={brands}
                selected={selectedBrand}
                onSelect={setSelectedBrand}
                placeholder="Buscar marca..."
              />
            )}
          </>
        )}

        {/* Modelo */}
        {selectedBrand && (
          <>
            <Text style={styles.label}>Modelo *</Text>
            {loadingModels ? (
              <ActivityIndicator color="#2563eb" style={{ marginBottom: 16 }} />
            ) : (
              <SearchSelect
                items={models}
                selected={selectedModel}
                onSelect={setSelectedModel}
                placeholder="Buscar modelo..."
              />
            )}
          </>
        )}

        {/* Ano, Placa, KM */}
        {selectedModel && (
          <>
            <Text style={styles.label}>Ano *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2023"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              maxLength={4}
            />

            <Text style={styles.label}>Placa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: ABC1D23"
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
              maxLength={8}
            />

            <Text style={styles.label}>KM atual</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 15.000"
              value={maskKm(currentKm)}
              onChangeText={(v) => setCurrentKm(v.replace(/\D/g, ''))}
              keyboardType="numeric"
            />
          </>
        )}

        </ScrollView>

        {/* Botão fixo no rodapé */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !selectedModel && { opacity: 0.4 }]}
            onPress={handleSave}
            disabled={saving || !selectedModel}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Salvando...' : 'Salvar veículo'}
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
  footer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: { flexDirection: 'row' },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  typeBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeBtnText: { fontSize: 13, color: '#666', fontWeight: '500', marginTop: 4 },
  typeBtnTextActive: { color: '#fff' },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
