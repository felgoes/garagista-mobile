import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { deleteMaintenance } from '../services/maintenances';
import { deleteFuelLog } from '../services/fuelLogs';
import {
  deleteVehiclePhoto,
  uploadVehiclePhoto,
} from '../services/vehicles';
import VehicleEquipment from '../components/VehicleEquipment';

const TABS = ['Peças', 'Manutenções', 'Abastecimentos'];

const VEHICLE_ICONS = {
  carro: 'car',
  moto: 'motorbike',
  caminhao: 'truck',
};

function formatConsumption(consumption) {
  if (consumption == null || Number.isNaN(Number(consumption))) {
    return null;
  }

  return Number(consumption).toFixed(1).replace('.', ',');
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

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicle: initialVehicle } = route.params;
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const ENDPOINTS = [
    `/vehicles/${vehicle.id}/parts`,
    `/vehicles/${vehicle.id}/maintenances`,
    `/vehicles/${vehicle.id}/fuel-logs`,
  ];

  const loadVehicle = useCallback(async () => {
    try {
      const response = await api.get(`/vehicles/${vehicle.id}`);
      setVehicle(response.data);
    } catch {}
  }, [vehicle.id]);

  const loadData = useCallback(async () => {
    try {
      const response = await api.get(ENDPOINTS[activeTab]);
      setData(response.data);
    } catch {
      setData([]);
    }
  }, [activeTab, vehicle.id]);

  useFocusEffect(
    useCallback(() => {
      loadVehicle();
      loadData();
    }, [loadVehicle, loadData])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function pickVehiclePhoto(source) {
    try {
      if (source === 'camera') {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permissão necessária',
            'Libere a câmera para tirar a foto do veículo.'
          );
          return;
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permissão necessária',
            'Libere a galeria para escolher a foto do veículo.'
          );
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 4],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 4],
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploadingPhoto(true);
      const updatedVehicle = await uploadVehiclePhoto(
        vehicle.id,
        result.assets[0]
      );
      setVehicle(updatedVehicle);
    } catch (e) {
      const msg =
        e.response?.data?.detail ||
        'Não foi possível enviar a foto do veículo.';
      Alert.alert('Erro', msg);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handlePhotoPress() {
    if (uploadingPhoto) {
      return;
    }

    const options = [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar foto', onPress: () => pickVehiclePhoto('camera') },
      { text: 'Escolher da galeria', onPress: () => pickVehiclePhoto('library') },
    ];

    if (vehicle.photo_url) {
      options.push({
        text: 'Remover foto',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploadingPhoto(true);
            const updatedVehicle = await deleteVehiclePhoto(vehicle.id);
            setVehicle(updatedVehicle);
          } catch (e) {
            const msg =
              e.response?.data?.detail ||
              'Não foi possível remover a foto do veículo.';
            Alert.alert('Erro', msg);
          } finally {
            setUploadingPhoto(false);
          }
        },
      });
    }

    Alert.alert('Foto do veículo', 'Escolha uma opção', options);
  }

  function confirmDelete(id, type) {
    Alert.alert('Remover registro', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            if (type === 'maintenance') await deleteMaintenance(vehicle.id, id);
            else await deleteFuelLog(vehicle.id, id);
            setData((prev) => prev.filter((i) => i.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível remover.');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    if (activeTab === 1)
      return (
        <MaintenanceItem
          item={item}
          onDelete={() => confirmDelete(item.id, 'maintenance')}
          onEdit={() => navigation.navigate('EditMaintenance', { vehicle, maintenance: item })}
        />
      );
    if (activeTab === 2)
      return (
        <FuelItem
          item={item}
          onDelete={() => confirmDelete(item.id, 'fuel')}
          onEdit={() => navigation.navigate('EditFuelLog', { vehicle, log: item })}
        />
      );
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {vehicle.brand.name} {vehicle.model.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <MaterialCommunityIcons
          name="pencil"
          size={14}
          color="#94a3b8"
          style={styles.cardEditIcon}
        />
        <View style={styles.infoCardContent}>
          {/* Foto / placeholder */}
          <TouchableOpacity
            style={styles.photoPlaceholder}
            onPress={handlePhotoPress}
            activeOpacity={0.85}
            disabled={uploadingPhoto}
          >
            {vehicle.photo_url ? (
              <Image
                source={{ uri: vehicle.photo_url }}
                style={styles.vehiclePhoto}
              />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={VEHICLE_ICONS[vehicle.vehicle_type] || 'car'}
                  size={40}
                  color="#2563eb"
                />
                <Text style={styles.photoLabel}>Adicionar foto</Text>
              </>
            )}
            {uploadingPhoto && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Dados */}
          <TouchableOpacity
            style={styles.infoData}
            onPress={() => navigation.navigate('EditVehicle', { vehicle })}
            activeOpacity={0.85}
          >
            <View style={styles.infoRow}>
              <Info label="Ano" value={String(vehicle.year)} />
              <Info label="KM" value={vehicle.current_km.toLocaleString('pt-BR')} />
            </View>

            {/* Placa */}
            {vehicle.plate ? (
              <View style={styles.plate}>
                <View style={styles.plateHeader}>
                  <Text style={styles.plateMercosul}>MERCOSUL</Text>
                  <Text style={styles.plateBrasil}>BRASIL</Text>
                  <Text style={styles.plateFlag}>🇧🇷</Text>
                </View>
                <View style={styles.plateBody}>
                  <Text style={styles.plateNumber}>{vehicle.plate}</Text>
                  <Text style={styles.plateBR}>BR</Text>
                </View>
              </View>
            ) : (
              <View style={styles.plateEmpty}>
                <MaterialCommunityIcons name="card-outline" size={14} color="#2563eb" />
                <Text style={styles.plateEmptyText}>Adicionar placa</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => { setActiveTab(i); setData([]); }}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Aba Peças — view RPG */}
      {activeTab === 0 ? (
        <VehicleEquipment
          vehicle={vehicle}
          parts={data}
          onSlotPress={(slot) => {
            navigation.navigate('SlotParts', { vehicle, slot });
          }}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="inbox-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum registro ainda</Text>
            </View>
          }
        />
      )}

      {/* FAB — só nas abas de manutenção e abastecimento */}
      {activeTab > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            const screens = ['AddPart', 'AddMaintenance', 'AddFuelLog'];
            navigation.navigate(screens[activeTab], { vehicle });
          }}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MaintenanceItem({ item, onDelete, onEdit }) {
  const date = new Date(item.date).toLocaleDateString('pt-BR');
  return (
    <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.type}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.cardDate}>{date}</Text>
          <TouchableOpacity onPress={onDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardMeta}>{item.km.toLocaleString('pt-BR')} km</Text>
        {item.cost && (
          <Text style={styles.cardMeta}>R$ {item.cost.toFixed(2)}</Text>
        )}
      </View>
      {item.description && (
        <Text style={styles.cardDesc}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );
}

function PartItem({ item }) {
  const date = item.installed_date
    ? new Date(item.installed_date).toLocaleDateString('pt-BR')
    : null;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.brand && <Text style={styles.cardDate}>{item.brand}</Text>}
      </View>
      <View style={styles.cardRow}>
        {item.installed_km && (
          <Text style={styles.cardMeta}>
            Instalada: {item.installed_km.toLocaleString('pt-BR')} km
          </Text>
        )}
        {date && <Text style={styles.cardMeta}>{date}</Text>}
      </View>
      {item.next_km && (
        <Text style={styles.cardNext}>
          Trocar em: {item.next_km.toLocaleString('pt-BR')} km
        </Text>
      )}
    </View>
  );
}

function FuelItem({ item, onDelete, onEdit }) {
  const date = new Date(item.date).toLocaleDateString('pt-BR');
  const formattedConsumption = formatConsumption(item.consumption);
  const accentColor = item.consumption ? consumptionColor(item.consumption) : '#2563eb';

  return (
    <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{date}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.cardDate}>R$ {item.total_cost.toFixed(2)}</Text>
          <TouchableOpacity onPress={onDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardMeta}>{item.km.toLocaleString('pt-BR')} km</Text>
        <Text style={styles.cardMeta}>{item.liters}L</Text>
        <Text style={styles.cardMeta}>R$ {item.price_per_liter.toFixed(2)}/L</Text>
      </View>
      {formattedConsumption !== null && (
        <View
          style={[
            styles.consumptionPill,
            {
              backgroundColor: accentColor + '18',
              borderColor: accentColor + '33',
            },
          ]}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={16}
            color={accentColor}
          />
          <Text style={[styles.consumptionPillValue, { color: accentColor }]}>
            {formattedConsumption} km/L
          </Text>
          <Text style={[styles.consumptionPillLabel, { color: accentColor }]}>
            {consumptionLabel(item.consumption)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  infoCard: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardEditIcon: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  vehiclePhoto: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: 10,
    color: '#2563eb',
    marginTop: 4,
    textAlign: 'center',
  },
  infoData: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  plate: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  plateHeader: {
    backgroundColor: '#1a4fa3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  plateMercosul: {
    fontSize: 7,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  plateBrasil: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  plateFlag: {
    fontSize: 10,
  },
  plateBody: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  plateBR: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    fontSize: 7,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  plateEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  plateEmptyText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#111' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#2563eb', fontWeight: '700' },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#bbb', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  cardDate: { fontSize: 13, color: '#666' },
  cardRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#666' },
  cardDesc: { fontSize: 13, color: '#888', marginTop: 4 },
  cardNext: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '600',
  },
  consumptionPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  consumptionPillValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  consumptionPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
