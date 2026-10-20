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

let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: () => Promise<string | null>) {
  clerkTokenGetter = getter;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  // Attach Clerk Bearer token if user is signed in
  try {
    let token: string | null = null;
    if (clerkTokenGetter) {
      token = await clerkTokenGetter();
    } else if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
      token = await (window as any).Clerk.session.getToken();
    }

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (tokenErr) {
    // Session token retrieval silent fallback
  }

  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    if (!config.headers['X-XSRF-TOKEN']) {
      const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/) : null;
      if (match) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
      }
    }
  }
  return config;
});


apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    if (error.response?.data) {
      console.warn(`[API ${status}] ${error.config?.method?.toUpperCase()} ${requestUrl}:`, error.response.data);
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
  confidenceScore?: number;
  metrics?: {
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

  const rawProb = payload?.aiProbability ?? payload?.probability;
  if (typeof rawProb !== 'number' || !Number.isFinite(rawProb)) {
    throw new Error('The verification engine returned an unexpected response.');
  }
  const aiProbability = normalizeScore(rawProb);

  const confidenceScore =
    typeof payload?.confidenceScore === 'number' && Number.isFinite(payload.confidenceScore)
      ? normalizeScore(payload.confidenceScore)
      : undefined;

  const rawMetrics = payload?.metrics;
  const hasCompleteMetrics =
    rawMetrics != null &&
    typeof rawMetrics.perplexity === 'number' &&
    Number.isFinite(rawMetrics.perplexity) &&
    typeof rawMetrics.burstiness === 'number' &&
    Number.isFinite(rawMetrics.burstiness) &&
    typeof rawMetrics.consistency === 'number' &&
    Number.isFinite(rawMetrics.consistency);

  const metrics = hasCompleteMetrics
    ? {
        perplexity: normalizeScore(rawMetrics.perplexity),
        burstiness: normalizeScore(rawMetrics.burstiness),
        consistency: normalizeScore(rawMetrics.consistency),
      }
    : undefined;

  const patterns = Array.isArray(payload?.patterns)
    ? payload.patterns.map((pattern) => String(pattern).trim()).filter(Boolean)
    : [];
  const analysis =
    typeof payload?.analysis === 'string' && payload.analysis.trim()
      ? payload.analysis
      : 'No analysis details were returned by the verification engine.';

  return { aiProbability, confidenceScore, metrics, patterns, analysis };
}

export interface BackendDetectionRecord {
  id: number;
  username: string;
  contentPreview: string;
  result: string;
  confidence: number;
  createdAt?: string;
}

export async function getUserDetections(): Promise<BackendDetectionRecord[]> {
  try {
    const response = await apiClient.get('/api/detections/all');
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch backend detections:', error);
    return [];
  }
}

export async function getRecentUserDetections(): Promise<BackendDetectionRecord[]> {
  try {
    const response = await apiClient.get('/api/detections/recent');
    return response.data || [];
  } catch (error) {
    console.warn('Failed to fetch recent backend detections:', error);
    return [];
  }
}

export async function saveUserDetection(data: { contentPreview: string; result: string; confidence: number }): Promise<{ id: number }> {
  const response = await apiClient.post('/api/detections', data);
  return response.data;
}

export async function deleteUserDetection(id: number | string): Promise<boolean> {
  try {
    await apiClient.delete(`/api/detections/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete detection record:', error);
    throw error;
  }
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

export async function getAdminUsers(page?: number, size?: number, q?: string): Promise<any> {
  try {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    if (q) params.q = q;
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
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

// -------------------------------------------------------------
// Billing & SaaS Entitlement APIs
// -------------------------------------------------------------

export interface PlanDefinition {
  id: string;
  name: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyScans: number;
  maxCharsPerAnalysis: number;
  maxUploadBytes: number;
  monthlyAdvisorMessages: number;
  historyRetentionDays: number;
  seats: number;
  exportEnabled: boolean;
  apiAccessEnabled: boolean;
  supportTier: string;
  overageAllowed: boolean;
}

export interface EntitlementDetails {
  plan: string;
  planName: string;
  maxCharsPerAnalysis: number;
  maxUploadBytes: number;
  monthlyScans: number;
  monthlyAdvisorMessages: number;
  historyRetentionDays: number;
  exportEnabled: boolean;
  apiAccessEnabled: boolean;
  supportTier: string;
  overageAllowed: boolean;
}

export interface UsageEntitlementInfo {
  used: number;
  limit: number;
  resetsAt: string;
}

export interface UsageResponse {
  period: string;
  periodStart: string;
  periodEnd: string;
  plan: string;
  status: string;
  seats: number;
  trialEnd: string | null;
  entitlements: {
    scans?: UsageEntitlementInfo;
    advisor_messages?: UsageEntitlementInfo;
    characters?: UsageEntitlementInfo;
    [key: string]: UsageEntitlementInfo | undefined;
  };
}

export interface BillingInvoiceItem {
  id: number;
  providerInvoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  amountFormatted: string;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

export async function getBillingPlans(): Promise<PlanDefinition[]> {
  const response = await apiClient.get('/api/billing/plans');
  return response.data || [];
}

export async function getBillingEntitlements(): Promise<EntitlementDetails> {
  const response = await apiClient.get('/api/billing/entitlements');
  return response.data;
}

export async function getUsage(): Promise<UsageResponse> {
  const response = await apiClient.get('/api/usage');
  return response.data;
}

export async function createCheckoutSession(
  plan: string,
  interval: string = 'monthly',
  seats: number = 1
): Promise<{ url: string }> {
  const response = await apiClient.post('/api/billing/checkout', {
    plan,
    interval,
    seats,
  });
  return response.data;
}

export async function createPortalSession(returnUrl?: string): Promise<{ url: string }> {
  const response = await apiClient.post('/api/billing/portal', {
    returnUrl,
  });
  return response.data;
}

export async function getInvoices(page: number = 0, size: number = 20): Promise<{
  content: BillingInvoiceItem[];
  totalElements: number;
  totalPages: number;
  number: number;
}> {
  const response = await apiClient.get('/api/billing/invoices', {
    params: { page, size },
  });
  return response.data;
}

export async function toggleUserLock(userId: number, locked: boolean): Promise<any> {
  const response = await apiClient.patch(`/api/admin/users/${userId}/lock`, null, {
    params: { locked },
  });
  return response.data;
}

// -------------------------------------------------------------
// Team & Workspace APIs
// -------------------------------------------------------------

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  ownerUserId: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  memberCount: number;
  seats: number;
  plan: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: number;
  username: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  isCurrentUser: boolean;
  isOwner: boolean;
}

export interface WorkspaceInvitation {
  id: number;
  workspaceId: number;
  workspaceName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  token?: string;
  expiresAt: string;
  createdAt: string;
}

export interface PublicInvitation {
  workspaceName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  inviterName: string;
  expiresAt: string;
  isValid: boolean;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await apiClient.get('/api/workspaces');
  return response.data || [];
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const response = await apiClient.post('/api/workspaces', { name });
  return response.data;
}

export async function switchWorkspace(id: number): Promise<Workspace> {
  const response = await apiClient.post(`/api/workspaces/${id}/switch-default`);
  return response.data;
}

export async function getWorkspaceMembers(id: number): Promise<WorkspaceMember[]> {
  const response = await apiClient.get(`/api/workspaces/${id}/members`);
  return response.data || [];
}

export async function updateMemberRole(workspaceId: number, userId: number, role: string): Promise<void> {
  await apiClient.patch(`/api/workspaces/${workspaceId}/members/${userId}/role`, { role });
}

export async function removeMember(workspaceId: number, userId: number): Promise<void> {
  await apiClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
}

export async function getWorkspaceInvitations(workspaceId: number): Promise<WorkspaceInvitation[]> {
  const response = await apiClient.get(`/api/workspaces/${workspaceId}/invitations`);
  return response.data || [];
}

export async function inviteWorkspaceMember(workspaceId: number, email: string, role: string): Promise<WorkspaceInvitation> {
  const response = await apiClient.post(`/api/workspaces/${workspaceId}/invitations`, { email, role });
  return response.data;
}

export async function cancelWorkspaceInvitation(workspaceId: number, invitationId: number): Promise<void> {
  await apiClient.delete(`/api/workspaces/${workspaceId}/invitations/${invitationId}`);
}

export async function getPublicInvitation(token: string): Promise<PublicInvitation> {
  const response = await apiClient.get(`/api/workspaces/invitations/${token}`);
  return response.data;
}

export async function acceptWorkspaceInvitation(token: string): Promise<Workspace> {
  const response = await apiClient.post(`/api/workspaces/invitations/${token}/accept`);
  return response.data;
}

export async function transferWorkspaceOwnership(workspaceId: number, newOwnerUserId: number): Promise<void> {
  await apiClient.post(`/api/workspaces/${workspaceId}/transfer-ownership`, { newOwnerUserId });
}

export async function deleteWorkspace(workspaceId: number): Promise<void> {
  await apiClient.delete(`/api/workspaces/${workspaceId}`);
}

export default apiClient;
