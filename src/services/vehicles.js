import api from './api';

export async function getVehicles() {
  const response = await api.get('/vehicles');
  return response.data;
}

export async function createVehicle(data) {
  const response = await api.post('/vehicles', data);
  return response.data;
}

export async function updateVehicle(id, data) {
  const response = await api.patch(`/vehicles/${id}`, data);
  return response.data;
}

export async function uploadVehiclePhoto(id, asset) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `vehicle-${id}.jpg`,
    type: asset.mimeType || asset.type || 'image/jpeg',
  });

  const response = await api.post(`/vehicles/${id}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteVehiclePhoto(id) {
  const response = await api.delete(`/vehicles/${id}/photo`);
  return response.data;
}

export async function deleteVehicle(id) {
  await api.delete(`/vehicles/${id}`);
}
