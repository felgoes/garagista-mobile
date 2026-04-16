import api from './api';

export function getParts(vehicleId, slot = null) {
  const params = slot ? { params: { slot } } : {};
  return api.get(`/vehicles/${vehicleId}/parts`, params);
}

export function createPart(vehicleId, data) {
  return api.post(`/vehicles/${vehicleId}/parts`, data);
}

export function deletePart(vehicleId, partId) {
  return api.delete(`/vehicles/${vehicleId}/parts/${partId}`);
}
