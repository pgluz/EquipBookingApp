const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5134/api';

export async function createReservation(reservationData) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/Reservation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(reservationData)
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Nie udało się złożyć rezerwacji.';
    throw new Error(message);
  }

  return data;
}

export async function getMyReservations() {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/Reservation/me`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Nie udało się pobrać Twoich rezerwacji.';
    throw new Error(message);
  }

  return data;
}

export async function getAllReservations() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/Reservation`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) throw new Error('Nie udało się pobrać listy rezerwacji.');
  return response.json();
}

export async function acceptReservation(id) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/Reservation/${id}/accept`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) throw new Error('Nie udało się zaakceptować rezerwacji.');
  return response.json();
}

export async function rejectReservation(id) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/Reservation/${id}/reject`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) throw new Error('Nie udało się odrzucić rezerwacji.');
  return response.json();
}