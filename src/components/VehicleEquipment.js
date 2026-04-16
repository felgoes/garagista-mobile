import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPartStatus, STATUS_COLORS, STATUS_ICONS } from '../utils/partStatus';

const VEHICLE_ICONS = {
  carro: 'car',
  moto: 'motorbike',
  caminhao: 'truck',
};

// Slots padrão por tipo de veículo
const SLOTS = {
  moto: [
    { key: 'motor', label: 'Motor', icon: 'engine' },
    { key: 'oleo', label: 'Óleo', icon: 'oil' },
    { key: 'corrente', label: 'Corrente', icon: 'link' },
    { key: 'embreagem', label: 'Embreagem', icon: 'car-shift-pattern' },
    { key: 'pneus', label: 'Pneus', icon: 'circle-outline' },
    { key: 'freio_d', label: 'Freio D.', icon: 'octagon-outline' },
    { key: 'freio_t', label: 'Freio T.', icon: 'octagon-outline' },
    { key: 'bateria', label: 'Bateria', icon: 'battery' },
    { key: 'filtro', label: 'Filtro Ar', icon: 'air-filter' },
    { key: 'vela', label: 'Vela', icon: 'flash' },
  ],
  carro: [
    { key: 'motor', label: 'Motor', icon: 'engine' },
    { key: 'oleo', label: 'Óleo', icon: 'oil' },
    { key: 'cambio', label: 'Câmbio', icon: 'car-shift-pattern' },
    { key: 'suspensao', label: 'Suspensão', icon: 'sine-wave' },
    { key: 'pneus', label: 'Pneus', icon: 'circle-outline' },
    { key: 'freio', label: 'Freios', icon: 'octagon-outline' },
    { key: 'bateria', label: 'Bateria', icon: 'battery' },
    { key: 'filtro', label: 'Filtro Ar', icon: 'air-filter' },
  ],
  caminhao: [
    { key: 'motor', label: 'Motor', icon: 'engine' },
    { key: 'oleo', label: 'Óleo', icon: 'oil' },
    { key: 'pneus', label: 'Pneus', icon: 'circle-outline' },
    { key: 'freio', label: 'Freios', icon: 'octagon-outline' },
    { key: 'bateria', label: 'Bateria', icon: 'battery' },
    { key: 'filtro', label: 'Filtro Ar', icon: 'air-filter' },
    { key: 'embreagem', label: 'Embreagem', icon: 'car-shift-pattern' },
    { key: 'suspensao', label: 'Suspensão', icon: 'sine-wave' },
  ],
};

function getStatus(part, currentKm) {
  if (!part) return 'empty';
  return getPartStatus(part, currentKm);
}

export default function VehicleEquipment({ vehicle, parts, onSlotPress }) {
  const slots = SLOTS[vehicle.vehicle_type] || SLOTS.carro;
  const vehicleIcon = VEHICLE_ICONS[vehicle.vehicle_type] || 'car';

  function findPart(slotKey) {
    const slotParts = parts.filter((p) => p.slot === slotKey);
    if (slotParts.length === 0) return null;
    const order = { overdue: 0, warning: 1, ok: 2 };
    return slotParts.sort(
      (a, b) =>
        order[getStatus(a, vehicle.current_km)] -
        order[getStatus(b, vehicle.current_km)]
    )[0];
  }

  const half = Math.ceil(slots.length / 2);
  const leftSlots = slots.slice(0, half);
  const rightSlots = slots.slice(half);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="garage-open" size={15} color="#94a3b8" />
        <Text style={styles.title}>GARAGEM</Text>
      </View>

      <View style={styles.grid}>
        {/* Coluna esquerda */}
        <View style={styles.column}>
          {leftSlots.map((slot) => {
            const part = findPart(slot.key);
            const status = getStatus(part, vehicle.current_km);
            const colors = STATUS_COLORS[status];
            return (
              <TouchableOpacity
                key={slot.key}
                style={[styles.slot, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => onSlotPress(slot, part)}
              >
                <MaterialCommunityIcons
                  name={slot.icon}
                  size={20}
                  color={colors.icon}
                />
                <Text style={[styles.slotLabel, { color: colors.text }]}>
                  {slot.label}
                </Text>
                <MaterialCommunityIcons
                  name={STATUS_ICONS[status]}
                  size={12}
                  color={colors.icon}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Centro — ícone do veículo */}
        <View style={styles.center}>
          <View style={styles.vehicleIcon}>
            <MaterialCommunityIcons name={vehicleIcon} size={48} color="#2563eb" />
          </View>
          <View style={styles.legend}>
            {Object.entries(STATUS_COLORS).map(([key, val]) => (
              key !== 'empty' && (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: val.icon }]} />
                  <Text style={styles.legendText}>
                    {key === 'ok' ? 'Ok' : key === 'warning' ? 'Atenção' : 'Vencido'}
                  </Text>
                </View>
              )
            ))}
          </View>
        </View>

        {/* Coluna direita */}
        <View style={styles.column}>
          {rightSlots.map((slot) => {
            const part = findPart(slot.key);
            const status = getStatus(part, vehicle.current_km);
            const colors = STATUS_COLORS[status];
            return (
              <TouchableOpacity
                key={slot.key}
                style={[styles.slot, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => onSlotPress(slot, part)}
              >
                <MaterialCommunityIcons
                  name={slot.icon}
                  size={20}
                  color={colors.icon}
                />
                <Text style={[styles.slotLabel, { color: colors.text }]}>
                  {slot.label}
                </Text>
                <MaterialCommunityIcons
                  name={STATUS_ICONS[status]}
                  size={12}
                  color={colors.icon}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 100 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  column: { flex: 1, gap: 8 },
  slot: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  slotLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  center: { width: 100, alignItems: 'center', gap: 16 },
  vehicleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  legend: { gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 9, color: '#94a3b8' },
});
