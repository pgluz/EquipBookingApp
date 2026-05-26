const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5134/api';

export async function loginUser(login, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, password }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Nieprawidłowy login lub hasło.';
    throw new Error(message);
  }

  return data;
}