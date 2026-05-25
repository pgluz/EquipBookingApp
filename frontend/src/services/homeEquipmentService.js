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

async function sendRequest(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Nie udało się pobrać listy sprzętu.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getHomeEquipmentList() {
  let lastError = null;

  // Fallback zostawiony na wypadek różnych nazw endpointu w tasku D2-T1.
  for (const path of EQUIPMENT_API_PATHS) {
    try {
      const data = await sendRequest(path);

      if (Array.isArray(data)) {
        return data;
      }

      return data?.items || data?.equipments || data?.equipment || [];
    } catch (error) {
      lastError = error;

      if (error.status !== 404 && error.status !== 405) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Nie znaleziono endpointu listy sprzętu.');
}
