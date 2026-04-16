import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getParts, deletePart } from '../services/parts';
import { getPartStatus, STATUS_COLORS, STATUS_LABEL } from '../utils/partStatus';

export default function SlotPartsScreen({ route, navigation }) {
  const { vehicle, slot } = route.params;
  const [parts, setParts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getParts(vehicle.id, slot.key);
      setParts(res.data);
    } catch {
      setParts([]);
    }
  }, [vehicle.id, slot.key]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function confirmDelete(part) {
    Alert.alert(
      'Remover peça',
      `Remover "${part.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePart(vehicle.id, part.id);
              setParts((prev) => prev.filter((p) => p.id !== part.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover a peça.');
            }
          },
        },
      ]
    );
  }

  function renderItem({ item }) {
    const status = getPartStatus(item, vehicle.current_km);
    const colors = STATUS_COLORS[status];
    const label = STATUS_LABEL[status];
    const installedDate = item.installed_date
      ? new Date(item.installed_date).toLocaleDateString('pt-BR')
      : null;
    const nextDate = item.next_date
      ? new Date(item.next_date).toLocaleDateString('pt-BR')
      : null;

    return (
      <View style={[styles.card, { borderLeftColor: colors.badge, borderLeftWidth: 4 }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.partName}>{item.name}</Text>
            {item.brand && (
              <Text style={styles.partBrand}>{item.brand}</Text>
            )}
          </View>
          <View style={styles.cardActions}>
            {label && (
              <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.badgeText, { color: colors.badge }]}>{label}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={styles.deleteBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {item.installed_km != null && (
            <Text style={styles.metaText}>
              Instalada: {item.installed_km.toLocaleString('pt-BR')} km
            </Text>
          )}
          {installedDate && (
            <Text style={styles.metaText}>{installedDate}</Text>
          )}
          {item.cost != null && (
            <Text style={styles.metaText}>R$ {item.cost.toFixed(2)}</Text>
          )}
        </View>

        {(item.next_km != null || nextDate) && (
          <View style={styles.nextRow}>
            {item.next_km != null && (
              <Text style={[styles.nextKm, { color: colors.badge }]}>
                📍 {item.next_km.toLocaleString('pt-BR')} km
                {vehicle.current_km > 0 && ` (${(item.next_km - vehicle.current_km).toLocaleString('pt-BR')} restantes)`}
              </Text>
            )}
            {nextDate && (
              <Text style={[styles.nextKm, { color: colors.badge }]}>
                📅 Vence em {nextDate}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{slot.label}</Text>
          <Text style={styles.subtitle}>
            {vehicle.brand.name} {vehicle.model.name}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={parts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="inbox-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma peça cadastrada</Text>
            <Text style={styles.emptyHint}>Toque no + para adicionar</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPart', { vehicle, slot })}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
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
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  partName: { fontSize: 15, fontWeight: '700', color: '#111' },
  partBrand: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  metaText: { fontSize: 12, color: '#64748b' },
  nextRow: { marginTop: 6, gap: 2 },
  nextKm: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: '#bbb', marginTop: 8 },
  emptyHint: { fontSize: 13, color: '#ddd', marginTop: 4 },
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
