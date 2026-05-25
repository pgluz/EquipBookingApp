const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5134/api';

const EQUIPMENT_API_PATHS = ['/equipments', '/equipment'];

function getAuthHeaders() {
  const token = localStorage.getItem('token');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function sendRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Wystąpił błąd podczas komunikacji z API.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestWithEndpointFallback(buildEndpoint, options = {}) {
  const savedPath = sessionStorage.getItem('equipmentApiPath');

  const paths = savedPath
    ? [savedPath, ...EQUIPMENT_API_PATHS.filter((path) => path !== savedPath)]
    : EQUIPMENT_API_PATHS;

  let lastError = null;

  for (const path of paths) {
    try {
      const result = await sendRequest(buildEndpoint(path), options);
      sessionStorage.setItem('equipmentApiPath', path);
      return result;
    } catch (error) {
      lastError = error;

      // Fallback jest tylko po to, żeby dopasować się do nazwy endpointu z D2-T1.
      if (error.status !== 404 && error.status !== 405) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Nie znaleziono endpointu API sprzętu.');
}

export async function getEquipmentList() {
  const data = await requestWithEndpointFallback((path) => path);

  if (Array.isArray(data)) {
    return data;
  }

  return data?.items || data?.equipments || [];
}

export async function createEquipment(equipment) {
  return requestWithEndpointFallback((path) => path, {
    method: 'POST',
    body: JSON.stringify(equipment),
  });
}

export async function deleteEquipment(id) {
  return requestWithEndpointFallback((path) => `${path}/${id}`, {
    method: 'DELETE',
  });
}
