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
  indikator_ids: number[];
}

export interface IndikatorOption {
  id: number;
  kode: string | null;
  nama_indikator: string;
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

export async function fetchAdminRenaksi(params: { tahun?: string; search?: string; indikator_id?: number; opd_id?: number; status?: string } = {}): Promise<AdminRenaksi[]> {
  const qs = new URLSearchParams();
  if (params.tahun) qs.set('tahun', params.tahun);
  if (params.search) qs.set('search', params.search);
  if (params.indikator_id) qs.set('indikator_id', String(params.indikator_id));
  if (params.opd_id) qs.set('opd_id', String(params.opd_id));
  if (params.status) qs.set('status', params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await request<{ data: AdminRenaksi[] }>(`/admin/renaksi-programs${suffix}`);
  return data.data;
}

export async function fetchIndikatorOptions(): Promise<IndikatorOption[]> {
  const data = await request<{ data: IndikatorOption[] } | IndikatorOption[]>('/dashboard/renaksi-program-indikators');
  return Array.isArray(data) ? data : data.data;
}

export async function fetchSatuanOptions(): Promise<string[]> {
  const data = await request<{ data: string[] }>('/admin/renaksi-programs/satuan-options');
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
  indikator_ids?: number[];
}

export async function updateRenaksi(id: number, payload: RenaksiUpdatePayload): Promise<void> {
  await request(`/admin/renaksi-programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ── Kelola User (super admin) ─────────────────────

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_opd';
  opd_id: number | null;
  opd_nama: string | null;
  created_at: string | null;
}

export interface OpdOption {
  id: number;
  nama_opd: string;
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'admin_opd';
  opd_id?: number | null;
}

export async function fetchAdminUsers(params: { role?: string; opd_id?: number; search?: string } = {}): Promise<AdminUserRow[]> {
  const qs = new URLSearchParams();
  if (params.role) qs.set('role', params.role);
  if (params.opd_id) qs.set('opd_id', String(params.opd_id));
  if (params.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await request<{ data: AdminUserRow[] }>(`/admin/users${suffix}`);
  return data.data;
}

export async function fetchUserOpdOptions(): Promise<OpdOption[]> {
  const data = await request<{ data: OpdOption[] }>('/admin/users/opd-options');
  return data.data;
}

export async function createUser(payload: UserPayload): Promise<void> {
  await request('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateUser(id: number, payload: UserPayload): Promise<void> {
  await request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteUser(id: number): Promise<void> {
  await request(`/admin/users/${id}`, { method: 'DELETE' });
}

// ── Admin Report (indikator + target/capaian) ─────

export interface PilarOption {
  id: number;
  no_pilar: number;
  nama_pilar: string;
}

export interface IndikatorUpdatePayload {
  nama_indikator: string;
  pilar_id: number;
  opd_ids?: number[];
  sumber_data?: string | null;
  baseline_2024?: string | null;
  dokrenda?: string | null;
  kendala?: string | null;
  inovasi?: string | null;
  tahun: string;
  target?: number | null;
  capaian?: number | null;
}

export async function fetchPilarOptions(): Promise<PilarOption[]> {
  const data = await request<{ data: PilarOption[] }>('/admin/indikators/pilar-options');
  return data.data;
}

export async function updateIndikator(kode: string, payload: IndikatorUpdatePayload): Promise<void> {
  await request(`/admin/indikators/${encodeURIComponent(kode)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteIndikator(kode: string): Promise<void> {
  await request(`/admin/indikators/${encodeURIComponent(kode)}`, { method: 'DELETE' });
}
