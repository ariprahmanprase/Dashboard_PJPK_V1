export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_opd';
  opd_id: number | null;
  opd_nama: string | null;
}

export interface AdminRenaksi {
  id: number;
  no: number | null;
  tahun: string;
  dinas: string;
  opd_id: number | null;
  kode_program: string | null;
  program: string | null;
  rencana_aksi: string;
  jenis_target: 'kuantitatif' | 'kualitatif';
  target: string | null;
  target_nilai: string | null;
  target_satuan: string | null;
  realisasi: string | null;
  realisasi_nilai: string | null;
  kendala: string | null;
  catatan: string | null;
  status: 'Terlaksana' | 'Tidak Terlaksana';
  indikator: string[];
}

const TOKEN_KEY = 'pjpk_admin_token';
const USER_KEY = 'pjpk_admin_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

function storeSession(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const resp = await fetch(`/api${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (resp.status === 401) {
    clearSession();
    window.location.href = '/admin';
    throw new Error('Sesi berakhir, silakan masuk kembali.');
  }

  const body = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const firstError =
      body?.errors ? (Object.values(body.errors).flat()[0] as string) : body?.message;
    throw new Error(firstError || `Terjadi kesalahan (${resp.status}).`);
  }

  return body as T;
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const data = await request<{ token: string; user: AdminUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  storeSession(data.token, data.user);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}

export async function fetchMe(): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>('/auth/me');
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function fetchAdminRenaksi(params: { tahun?: string; search?: string } = {}): Promise<AdminRenaksi[]> {
  const qs = new URLSearchParams();
  if (params.tahun) qs.set('tahun', params.tahun);
  if (params.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await request<{ data: AdminRenaksi[] }>(`/admin/renaksi-programs${suffix}`);
  return data.data;
}

export interface RenaksiUpdatePayload {
  status: string;
  realisasi?: string | null;
  realisasi_nilai?: number | null;
  target?: string | null;
  target_nilai?: number | null;
  target_satuan?: string | null;
  kendala?: string | null;
  catatan?: string | null;
}

export async function updateRenaksi(id: number, payload: RenaksiUpdatePayload): Promise<void> {
  await request(`/admin/renaksi-programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
