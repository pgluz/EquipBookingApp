const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5134/api';

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

  if (response.status === 204) {
    return null;
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Wystąpił błąd podczas komunikacji z API użytkowników.';
    throw new Error(message);
  }

  return data;
}

export async function getUsers() {
  const data = await sendRequest('/users');

  if (Array.isArray(data)) {
    return data;
  }

  return data?.users || data?.items || [];
}

export async function updateUserPermissions(userId, permissions) {
  return sendRequest(`/users/${userId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify(permissions),
  });
}
