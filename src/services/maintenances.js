import api from './api';

export function getMaintenances(vehicleId) {
  return api.get(`/vehicles/${vehicleId}/maintenances`);
}

export function createMaintenance(vehicleId, data) {
  return api.post(`/vehicles/${vehicleId}/maintenances`, data);
}

export function updateMaintenance(vehicleId, maintenanceId, data) {
  return api.patch(`/vehicles/${vehicleId}/maintenances/${maintenanceId}`, data);
}

export function deleteMaintenance(vehicleId, maintenanceId) {
  return api.delete(`/vehicles/${vehicleId}/maintenances/${maintenanceId}`);
}
