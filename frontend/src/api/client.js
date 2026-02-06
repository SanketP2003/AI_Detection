
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Get CSRF token from cookie
 * The backend sets this as XSRF-TOKEN cookie
 */
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Build headers with CSRF token for mutating requests
 */
function buildHeaders(includeJson = true) {
  const headers = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return headers;
}

/**
 * Fetch the CSRF token by making a request to a public endpoint
 * This ensures the XSRF-TOKEN cookie is set before making mutating requests
 */
async function ensureCsrfToken() {
  if (!getCsrfToken()) {
    await fetch(`${API_BASE}/api/user/me`, { credentials: 'include' });
  }
}

export async function login({ username, password }) {
  const params = new URLSearchParams({ username, password });
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers,
    body: params.toString(),
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Login failed:', res.status, res.statusText);
    throw new Error(errorData?.error || 'Invalid username or password');
  }

  return getMe();
}

export async function registerUser({ username, password, email }) {
  // Build request body - only include email if it's provided and non-empty
  const body = { username, password };
  if (email && email.trim()) {
    body.email = email.trim();
  }

  const res = await fetch(`${API_BASE}/api/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Backend returns { success: false, error: "..." } or validation errors
    const errorMsg = data?.error || data?.message ||
      (data?.errors ? Object.values(data.errors).join(', ') : null) ||
      'Registration failed';
    console.error('Registration failed:', res.status, errorMsg);
    throw new Error(errorMsg);
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
    headers: buildHeaders(false),
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
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(user),
    credentials: 'include'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to create user');
  }
  return res.json();
}

export async function adminUpdateUser(id, update) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(update),
    credentials: 'include'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to update user');
  }
  return res.json();
}

export async function adminDeleteUser(id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
    credentials: 'include'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to delete user');
  }
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
  const res = await fetch(`${API_BASE}/api/chats/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
    credentials: 'include'
  });
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
