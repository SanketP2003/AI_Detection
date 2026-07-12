import axios, { AxiosError, AxiosInstance } from 'axios';

const apiEnv = (import.meta as any).env || {};

export const API_BASE_URL = apiEnv.VITE_API_BASE_URL || ((import.meta as any).env?.DEV ? 'http://localhost:8080' : '');

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
  error?: string | null;
};

function unwrapApiData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

export function parseApiError(error: unknown, fallback = 'Request failed. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as ApiEnvelope<unknown> | string | undefined;

    if (typeof response === 'string' && response.trim()) {
      return response;
    }

    if (response && typeof response === 'object') {
      const message = response.error || response.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    const requestUrl = error.config?.url || '';
    const isAuthBootstrap = requestUrl.includes('/api/user/me');
    const isLoginRequest = requestUrl.includes('/login');

    if (status === 401 && !isAuthBootstrap && !isLoginRequest && path !== '/signin') {
      window.location.href = '/signin';
    }

    return Promise.reject(error);
  }
);

/**
 * Auth APIs
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthUserDto {
  username: string | null;
  isAdmin: boolean;
  authenticated: boolean;
}

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export async function login(credentials: LoginRequest): Promise<AuthUserDto> {
  const params = new URLSearchParams({
    username: credentials.email,
    password: credentials.password,
  });

  await apiClient.post('/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return getCurrentUser();
}

export async function register(data: RegisterRequest): Promise<{ username: string }> {
  const response = await apiClient.post('/api/user/register', {
    username: data.username,
    email: data.email,
    password: data.password,
  });

  return unwrapApiData<{ username: string }>(response.data);
}

export async function getCurrentUser(): Promise<AuthUserDto> {
  try {
    const response = await apiClient.get('/api/user/me');
    return response.data || { username: null, isAdmin: false, authenticated: false };
  } catch {
    return { username: null, isAdmin: false, authenticated: false };
  }
}

export async function logout(): Promise<boolean> {
  try {
    await apiClient.post('/logout');
  } catch {
    // Ignore logout errors client-side to avoid trapping users in a stale session UI state.
  }
  return true;
}

export async function getUserProfile(): Promise<UserProfileDto> {
  const response = await apiClient.get('/api/user/profile');
  return unwrapApiData<UserProfileDto>(response.data);
}

export async function updateUserEmail(email: string): Promise<{ email: string }> {
  const response = await apiClient.put('/api/user/profile/email', { email });
  return unwrapApiData<{ email: string }>(response.data);
}

export async function updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/api/user/profile/password', {
    currentPassword,
    newPassword,
  });
}

export async function updateUsername(username: string): Promise<{ username: string }> {
  const response = await apiClient.put('/api/user/profile/username', { username });
  return unwrapApiData<{ username: string }>(response.data);
}

/**
 * Writing Advisor chat
 */
export async function chatWithAdvisor(prompt: string, history: Array<{role: string; content: string}> = []): Promise<string> {
  const payload = { prompt, history };
  const response = await apiClient.post('/api/chat', payload);
  const data = response.data as { text?: string; error?: string } | string;

  if (typeof data === 'string') {
    return data;
  }

  if (data && typeof data === 'object') {
    if (data.error) throw new Error(String(data.error));
    return String(data.text ?? '');
  }

  return '';
}

/**
 * Content Authenticity APIs
 */

export interface DetectionRequest {
  text: string;
}

type DetectionMetrics = {
  perplexity?: number;
  burstiness?: number;
  consistency?: number;
};

type RawDetectionResponse = {
  aiProbability?: number;
  probability?: number;
  confidenceScore?: number;
  metrics?: DetectionMetrics;
  patterns?: string[];
  analysis?: string;
  error?: string;
};

export interface DetectionResponse {
  aiProbability: number;
  confidenceScore: number;
  metrics: {
    perplexity: number;
    burstiness: number;
    consistency: number;
  };
  patterns: string[];
  analysis: string;
}

function normalizeScore(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const normalized = numericValue > 1 ? numericValue / 100 : numericValue;
  return Math.min(1, Math.max(0, normalized));
}

export async function detectAiContent(text: string): Promise<DetectionResponse> {
  const response = await apiClient.post('/api/detect/bulk-ai', { text });
  const payload = typeof response.data === 'string' ? JSON.parse(response.data) : response.data as RawDetectionResponse;

  if (payload?.error) {
    throw new Error(payload.error);
  }

  const aiProbability = normalizeScore(payload?.aiProbability ?? payload?.probability ?? 0);
  const confidenceScore = normalizeScore(payload?.confidenceScore ?? payload?.metrics?.consistency ?? aiProbability);
  const metrics = {
    perplexity: normalizeScore(payload?.metrics?.perplexity ?? 0),
    burstiness: normalizeScore(payload?.metrics?.burstiness ?? 0),
    consistency: normalizeScore(payload?.metrics?.consistency ?? confidenceScore),
  };
  const patterns = Array.isArray(payload?.patterns)
    ? payload.patterns.map((pattern) => String(pattern).trim()).filter(Boolean)
    : [];
  const analysis =
    typeof payload?.analysis === 'string' && payload.analysis.trim()
      ? payload.analysis
      : 'No analysis details were returned by the verification engine.';

  return { aiProbability, confidenceScore, metrics, patterns, analysis };
}

/**
 * Chat APIs
 */

export interface Chat {
  id: number;
  username: string;
  message: string;
  response: string;
  createdAt: string;
}

export async function getRecentChats(): Promise<Chat[]> {
  try {
    const response = await apiClient.get('/api/chats/recent');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch recent chats:', error);
    return [];
  }
}

export async function getAllChats(): Promise<Chat[]> {
  try {
    const response = await apiClient.get('/api/chats/all');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch all chats:', error);
    return [];
  }
}

export async function deleteChat(id: number | string): Promise<boolean> {
  try {
    await apiClient.delete(`/api/chats/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  }
}

/**
 * Admin APIs
 */

export async function getAdminUsers(): Promise<any[]> {
  try {
    const response = await apiClient.get('/api/admin/users');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

export async function createAdminUser(user: any): Promise<any> {
  try {
    const response = await apiClient.post('/api/admin/users', user);
    return response.data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

export async function updateAdminUser(id: string, data: any): Promise<any> {
  try {
    const response = await apiClient.put(`/api/admin/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/api/admin/users/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

export async function getAdminRecentHistory(): Promise<any[]> {
  try {
    const response = await apiClient.get('/api/admin/history/recent');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
}

export async function getAdminHistoryForUser(username: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/api/admin/history/user/${encodeURIComponent(username)}`);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch user history:', error);
    return [];
  }
}

export async function getAdminRecentChats(): Promise<Chat[]> {
  try {
    const response = await apiClient.get('/api/chats/admin/recent');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch admin chats:', error);
    return [];
  }
}

export async function getAdminChatsForUser(username: string): Promise<Chat[]> {
  try {
    const response = await apiClient.get(`/api/chats/admin/user/${encodeURIComponent(username)}`);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch user chats:', error);
    return [];
  }
}

export default apiClient;
