import api from './api';

export function getFuelLogs(vehicleId) {
  return api.get(`/vehicles/${vehicleId}/fuel-logs`);
}

export function createFuelLog(vehicleId, data) {
  return api.post(`/vehicles/${vehicleId}/fuel-logs`, data);
}

export function updateFuelLog(vehicleId, fuelLogId, data) {
  return api.patch(`/vehicles/${vehicleId}/fuel-logs/${fuelLogId}`, data);
}

export function deleteFuelLog(vehicleId, fuelLogId) {
  return api.delete(`/vehicles/${vehicleId}/fuel-logs/${fuelLogId}`);
}
