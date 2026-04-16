import api from './api';

export async function getBrands(vehicleType) {
  const response = await api.get('/brands', {
    params: { vehicle_type: vehicleType },
  });
  return response.data;
}

export async function getModels(brandId) {
  const response = await api.get(`/brands/${brandId}/models`);
  return response.data;
}
