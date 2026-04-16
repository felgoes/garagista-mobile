import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICONS = {
  carro: 'car',
  moto: 'motorbike',
  caminhao: 'truck',
};

export default function VehicleCard({ vehicle, onPress }) {
  const icon = ICONS[vehicle.vehicle_type] || 'car';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={32} color="#2563eb" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {vehicle.brand.name} {vehicle.model.name}
        </Text>
        <Text style={styles.year}>{vehicle.year}</Text>
        {vehicle.plate && (
          <Text style={styles.plate}>{vehicle.plate}</Text>
        )}
      </View>
      <View style={styles.right}>
        <View style={styles.km}>
          <Text style={styles.kmValue}>
            {vehicle.current_km.toLocaleString('pt-BR')}
          </Text>
          <Text style={styles.kmLabel}>km</Text>
        </View>
        {vehicle.overdue_count > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>{vehicle.overdue_count} vencida{vehicle.overdue_count > 1 ? 's' : ''}</Text>
          </View>
        )}
        {vehicle.overdue_count === 0 && vehicle.warning_count > 0 && (
          <View style={[styles.alertBadge, styles.warningBadge]}>
            <Text style={[styles.alertText, styles.warningText]}>{vehicle.warning_count} atenção</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  year: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  plate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  km: {
    alignItems: 'flex-end',
  },
  alertBadge: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  alertText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  warningBadge: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
  },
  warningText: {
    color: '#ca8a04',
  },
  kmValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  kmLabel: {
    fontSize: 11,
    color: '#999',
  },
});
