
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function login({ username, password }) {
  
  const params = new URLSearchParams({ username, password });
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    credentials: 'include',
  });

  if (!res.ok) {
    console.error('Login failed:', res.status, res.statusText);
    throw new Error('Invalid username or password');
  }

  
  return getMe();
}

export async function registerUser({ username, password, email }) {
  const res = await fetch(`${API_BASE}/api/user/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, email }),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Registration failed');
  }
  return data;
}

export async function getMe() {
  try {
    const res = await fetch(`${API_BASE}/api/user/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      console.warn('Failed to fetch user info:', res.status, res.statusText);
      return { authenticated: false };
    }
    const data = await res.json();
    return data || { authenticated: false };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return { authenticated: false };
  }
}

export async function logout() {
  const res = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.ok;
}

export async function adminListUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function adminCreateUser(user) {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user), credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

export async function adminUpdateUser(id, update) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update), credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function adminDeleteUser(id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE', credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return true;
}

export async function adminRecentHistory() {
  const res = await fetch(`${API_BASE}/api/admin/history/recent`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function adminHistoryForUser(username) {
  const res = await fetch(`${API_BASE}/api/admin/history/user/${encodeURIComponent(username)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch user history');
  return res.json();
}

export async function adminGetConfiguredAdminUser() {
  const res = await fetch(`${API_BASE}/api/admin/admin-user`, { credentials: 'include' });
  if (!res.ok) throw new Error('Admin user not found');
  return res.json();
}

export async function adminGetUserByUsername(username) {
  const res = await fetch(`${API_BASE}/api/admin/users/username/${encodeURIComponent(username)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

export async function myRecentChats() {
  const res = await fetch(`${API_BASE}/api/chats/recent`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch recent chats');
  return res.json();
}
export async function myAllChats() {
  const res = await fetch(`${API_BASE}/api/chats/all`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch all chats');
  return res.json();
}
export async function deleteMyChat(id) {
  const res = await fetch(`${API_BASE}/api/chats/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete chat');
  return true;
}
export async function adminRecentChats() {
  const res = await fetch(`${API_BASE}/api/chats/admin/recent`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch global chats');
  return res.json();
}
export async function adminChatsForUser(username) {
  const res = await fetch(`${API_BASE}/api/chats/admin/user/${encodeURIComponent(username)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch user chats');
  return res.json();
}
