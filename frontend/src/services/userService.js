const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5134/api';

export async function getUsers() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/Auth/users`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });

  if (!response.ok) throw new Error('Nie udało się pobrać listy użytkowników.');
  return response.json();
}

export async function createUser(userData) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/Auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Nie udało się utworzyć konta.');
  return data;
}