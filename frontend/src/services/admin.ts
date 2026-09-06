export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_opd' | 'admin_analis';
  jabatan: string | null;
  opd_id: number | null;
  opd_nama: string | null;
  bidang?: string | null;
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
  dokumentasi: string | null;
  status: 'Tercapai' | 'Hampir Tercapai' | 'Tidak Tercapai' | 'Belum diisi';
  indikator: string[];
  indikator_ids: number[];
  pilar: string[];
  ai_recommendation: string | null;
  created_by_name: string | null;
  created_at: string | null;
}

export interface IndikatorOption {
  id: number;
  kode: string | null;
  nama_indikator: string;
  pilar_id?: number;
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

export interface ProfilePayload {
  name: string;
  jabatan?: string | null;
  current_password?: string;
  new_password?: string;
}

// Update profil diri sendiri — role/opd tidak ikut (hak akses hanya diubah super admin)
export async function updateProfile(payload: ProfilePayload): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function fetchAdminRenaksi(params: { tahun?: string; search?: string; indikator_id?: number; pilar_id?: number; opd_id?: number; status?: string } = {}): Promise<AdminRenaksi[]> {
  const qs = new URLSearchParams();
  if (params.tahun) qs.set('tahun', params.tahun);
  if (params.search) qs.set('search', params.search);
  if (params.indikator_id) qs.set('indikator_id', String(params.indikator_id));
  if (params.pilar_id) qs.set('pilar_id', String(params.pilar_id));
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
  status?: string;
  realisasi?: string | null;
  realisasi_nilai?: number | null;
  target?: string | null;
  target_nilai?: number | null;
  target_satuan?: string | null;
  kendala?: string | null;
  catatan?: string | null;
  dokumentasi?: string | null;
  indikator_ids?: number[];
}

export async function updateRenaksi(id: number, payload: RenaksiUpdatePayload): Promise<void> {
  await request(`/admin/renaksi-programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRenaksi(id: number): Promise<void> {
  await request(`/admin/renaksi-programs/${id}`, { method: 'DELETE' });
}

// ── Analisis & Rekomendasi AI (per renaksi) ──
export async function generateAiRecommendation(id: number): Promise<{ text: string; model: string | null }> {
  const data = await request<{ data: { ai_recommendation: string; ai_model?: string | null } }>(
    `/admin/renaksi-programs/${id}/ai-recommendation`,
    { method: 'POST' },
  );
  return { text: data.data.ai_recommendation, model: data.data.ai_model ?? null };
}

export async function deleteAiRecommendation(id: number): Promise<void> {
  await request(`/admin/renaksi-programs/${id}/ai-recommendation`, { method: 'DELETE' });
}

export interface RenaksiCreatePayload {
  tahun: string;
  opd_id: number;
  kode_program?: string | null;
  program?: string | null;
  rencana_aksi: string;
  jenis_target: 'kuantitatif' | 'kualitatif';
  target?: string | null;
  target_nilai?: number | null;
  target_satuan?: string | null;
  realisasi?: string | null;
  realisasi_nilai?: number | null;
  status?: string;
  kendala?: string | null;
  catatan?: string | null;
  dokumentasi?: string | null;
  indikator_ids?: number[];
}

export async function createRenaksi(payload: RenaksiCreatePayload): Promise<void> {
  await request('/admin/renaksi-programs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchRenaksiOpdOptions(): Promise<OpdOption[]> {
  const data = await request<{ data: OpdOption[] }>('/admin/renaksi-programs/opd-options');
  return data.data;
}

// Semua indikator untuk dropdown form — admin OPD otomatis terscope ke dinasnya di backend
export async function fetchAdminIndikatorOptions(): Promise<IndikatorOption[]> {
  const data = await request<{ data: IndikatorOption[] }>('/admin/renaksi-programs/indikator-options');
  return data.data;
}

// ── Kelola User (super admin) ─────────────────────

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_opd' | 'admin_analis';
  jabatan: string | null;
  opd_id: number | null;
  opd_nama: string | null;
  bidang?: string | null;
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
  role: 'super_admin' | 'admin_opd' | 'admin_analis';
  jabatan?: string | null;
  opd_id?: number | null;
  bidang?: string | null;
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

/* ── Impor renaksi dari Excel (admin OPD / super admin) ── */

/** Satu baris hasil parse preview dari backend. */
export interface ImportPreviewRow {
  no: number;
  valid: boolean;
  errors: string[];
  data: {
    tahun: string;
    kode_program: string | null;
    program: string | null;
    rencana_aksi: string;
    jenis_target: 'kuantitatif' | 'kualitatif';
    target: string | null;
    target_nilai: number | null;
    target_satuan: string | null;
    realisasi: string | null;
    realisasi_nilai: number | null;
    kendala: string | null;
    catatan: string | null;
    dokumentasi: string | null;
  };
}

export interface ImportPreviewResponse {
  message: string;
  valid_count: number;
  error_count: number;
  rows: ImportPreviewRow[];
}

/** Unduh template Excel (memicu download di browser). */
export async function downloadImportTemplate(): Promise<void> {
  const token = getToken();
  const resp = await fetch('/api/admin/renaksi-programs/import-template', {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (resp.status === 401) {
    clearSession();
    window.location.href = '/admin';
    throw new Error('Sesi berakhir, silakan masuk kembali.');
  }
  if (!resp.ok) throw new Error(`Gagal mengunduh template (${resp.status}).`);
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template-renaksi.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Upload file untuk dibaca & divalidasi (preview). */
export async function previewImportRenaksi(file: File): Promise<ImportPreviewResponse> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const resp = await fetch('/api/admin/renaksi-programs/import-preview', {
    method: 'POST',
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
  if (resp.status === 401) {
    clearSession();
    window.location.href = '/admin';
    throw new Error('Sesi berakhir, silakan masuk kembali.');
  }
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const firstError = body?.errors ? (Object.values(body.errors).flat()[0] as string) : body?.message;
    throw new Error(firstError || `Gagal membaca file (${resp.status}).`);
  }
  return body as ImportPreviewResponse;
}

/** Simpan batch baris valid (data dari preview). */
export async function storeImportRenaksi(rows: ImportPreviewRow['data'][]): Promise<{ message: string; saved: number }> {
  return request<{ message: string; saved: number }>('/admin/renaksi-programs/import-store', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
