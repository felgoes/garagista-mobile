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
import { updateVehicle } from '../services/vehicles';
import { maskKm, parseKm } from '../utils/masks';

export default function EditVehicleScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const [plate, setPlate] = useState(vehicle.plate || '');
  const [currentKm, setCurrentKm] = useState(String(vehicle.current_km));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateVehicle(vehicle.id, {
        plate: plate.trim().toUpperCase() || null,
        current_km: parseKm(currentKm),
      });
      navigation.goBack();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Erro ao salvar';
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
        <Text style={styles.title}>Editar veículo</Text>
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
  content: { padding: 24, paddingTop: 0 },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
