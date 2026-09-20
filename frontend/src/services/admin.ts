export interface AdminUser {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: 'super_admin' | 'admin_opd' | 'admin_analis';
  jabatan: string | null;
  opd_id: number | null;
  opd_nama: string | null;
  bidang?: string | null;
  avatar_url: string | null;
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

export async function login(login: string, password: string): Promise<AdminUser> {
  const data = await request<{ token: string; user: AdminUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
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

/** Upload / ganti foto profil (sudah di-crop 1:1 di client). */
export async function uploadAvatar(file: File): Promise<AdminUser> {
  const token = getToken();
  const form = new FormData();
  form.append('avatar', file);
  const resp = await fetch('/api/auth/avatar', {
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
    throw new Error(firstError || `Gagal mengunggah foto (${resp.status}).`);
  }
  const user = (body as { user: AdminUser }).user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
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

/**
 * Unduh laporan renaksi sebagai PDF (mengikuti filter aktif).
 * Tidak pakai helper request() karena responsnya blob, bukan JSON.
 */
export async function downloadRenaksiPdf(params: { tahun?: string; search?: string; indikator_id?: number; pilar_id?: number; status?: string; dinas?: string } = {}): Promise<void> {
  const token = getToken();
  const qs = new URLSearchParams();
  if (params.tahun) qs.set('tahun', params.tahun);
  if (params.search) qs.set('search', params.search);
  if (params.indikator_id) qs.set('indikator_id', String(params.indikator_id));
  if (params.pilar_id) qs.set('pilar_id', String(params.pilar_id));
  if (params.status) qs.set('status', params.status);
  if (params.dinas) qs.set('dinas', params.dinas);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const resp = await fetch(`/api/admin/renaksi-programs/export-pdf${suffix}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  if (resp.status === 401) {
    clearSession();
    window.location.href = '/admin';
    throw new Error('Sesi berakhir, silakan masuk kembali.');
  }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.message || `Gagal membuat PDF (${resp.status}).`);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-renaksi-${params.tahun || 'semua'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

// ── P1: Analisis Kinerja Indikator (AI) ──
export interface AiIndikatorOption {
  kode: string;
  nama_indikator: string;
  pilar: string | null;
}

export interface AiIndikatorResult {
  hasil: string;
  model: string | null;
  updated_at: string | null;
  oleh: string | null;
}

export async function fetchAiIndikatorOptions(): Promise<{ indikator: AiIndikatorOption[]; tahun: string[] }> {
  const data = await request<{ data: AiIndikatorOption[]; tahun: string[] }>('/admin/ai/indikator/options');
  return { indikator: data.data, tahun: data.tahun };
}

export async function fetchAiIndikator(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/indikator?${qs}`);
  return data.data;
}

export async function generateAiIndikator(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/indikator', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiIndikator(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/indikator', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P2: Analisis Portofolio OPD (AI) ──
export interface AiOpdOption {
  id: number;
  nama_opd: string;
}

export async function fetchAiOpdOptions(): Promise<{ opd: AiOpdOption[]; tahun: string[] }> {
  const data = await request<{ data: AiOpdOption[]; tahun: string[] }>('/admin/ai/opd/options');
  return { opd: data.data, tahun: data.tahun };
}

export async function fetchAiOpd(opdId: number, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ opd_id: String(opdId), tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/opd?${qs}`);
  return data.data;
}

export async function generateAiOpd(opdId: number, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/opd', {
    method: 'POST',
    body: JSON.stringify({ opd_id: opdId, tahun }),
  });
  return data.data;
}

export async function deleteAiOpd(opdId: number, tahun: string): Promise<void> {
  await request('/admin/ai/opd', {
    method: 'DELETE',
    body: JSON.stringify({ opd_id: opdId, tahun }),
  });
}

// ── P3: Root Cause Analysis (AI) ──
export async function fetchAiRootCauseOptions(): Promise<{ indikator: AiIndikatorOption[]; tahun: string[] }> {
  const data = await request<{ data: AiIndikatorOption[]; tahun: string[] }>('/admin/ai/root-cause/options');
  return { indikator: data.data, tahun: data.tahun };
}

export async function fetchAiRootCause(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/root-cause?${qs}`);
  return data.data;
}

export async function generateAiRootCause(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/root-cause', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiRootCause(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/root-cause', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P4: Activity-Outcome Effectiveness (AI) ──
export async function fetchAiEfektivitasOptions(): Promise<{ indikator: AiIndikatorOption[]; tahun: string[] }> {
  const data = await request<{ data: AiIndikatorOption[]; tahun: string[] }>('/admin/ai/efektivitas/options');
  return { indikator: data.data, tahun: data.tahun };
}

export async function fetchAiEfektivitas(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/efektivitas?${qs}`);
  return data.data;
}

export async function generateAiEfektivitas(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/efektivitas', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiEfektivitas(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/efektivitas', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P5: Corrective Action Generator (AI, chaining dari P1/P3/P4) ──
export interface AiSumberOption {
  kode: string;
  nama: string;
}

export interface AiCorrectiveStatus {
  sumber_tersedia: string[];
  tersimpan: Record<string, AiIndikatorResult>;
}

export async function fetchAiCorrectiveOptions(): Promise<{ indikator: AiIndikatorOption[]; tahun: string[]; sumber: AiSumberOption[] }> {
  const data = await request<{ data: AiIndikatorOption[]; tahun: string[]; sumber: AiSumberOption[] }>('/admin/ai/corrective-action/options');
  return { indikator: data.data, tahun: data.tahun, sumber: data.sumber };
}

export async function fetchAiCorrectiveStatus(kode: string, tahun: string): Promise<AiCorrectiveStatus> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  return request<AiCorrectiveStatus>(`/admin/ai/corrective-action?${qs}`);
}

export async function generateAiCorrective(kode: string, tahun: string, sumber: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/corrective-action', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun, sumber }),
  });
  return data.data;
}

export async function deleteAiCorrective(kode: string, tahun: string, sumber: string): Promise<void> {
  await request('/admin/ai/corrective-action', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun, sumber }),
  });
}

// ── P6: Red Indicator Alert (AI, hanya indikator berstatus merah) ──
export async function fetchAiRedAlertTahun(): Promise<string[]> {
  const data = await request<{ tahun: string[] }>('/admin/ai/red-alert/tahun-options');
  return data.tahun;
}

export async function fetchAiRedAlertOptions(tahun: string): Promise<AiIndikatorOption[]> {
  const qs = new URLSearchParams({ tahun }).toString();
  const data = await request<{ data: AiIndikatorOption[] }>(`/admin/ai/red-alert/options?${qs}`);
  return data.data;
}

export async function fetchAiRedAlert(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/red-alert?${qs}`);
  return data.data;
}

export async function generateAiRedAlert(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/red-alert', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiRedAlert(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/red-alert', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P7: Data Gap Analysis (AI, indikator dengan data belum memadai) ──
export async function fetchAiDataGapTahun(): Promise<string[]> {
  const data = await request<{ tahun: string[] }>('/admin/ai/data-gap/tahun-options');
  return data.tahun;
}

export async function fetchAiDataGapOptions(tahun: string): Promise<AiIndikatorOption[]> {
  const qs = new URLSearchParams({ tahun }).toString();
  const data = await request<{ data: AiIndikatorOption[] }>(`/admin/ai/data-gap/options?${qs}`);
  return data.data;
}

export async function fetchAiDataGap(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/data-gap?${qs}`);
  return data.data;
}

export async function generateAiDataGap(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/data-gap', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiDataGap(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/data-gap', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P8: PSRI Policy Diagnosis (AI) ──
export async function fetchAiPsriOptions(): Promise<{ indikator: AiIndikatorOption[]; tahun: string[] }> {
  const data = await request<{ data: AiIndikatorOption[]; tahun: string[] }>('/admin/ai/psri/options');
  return { indikator: data.data, tahun: data.tahun };
}

export async function fetchAiPsri(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/psri?${qs}`);
  return data.data;
}

export async function generateAiPsri(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/psri', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiPsri(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/psri', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P9: Cross-OPD Coordination (AI, hanya indikator lintas sektor) ──
export interface AiCrossOpdOption extends AiIndikatorOption {
  jumlah_opd: number;
}

export async function fetchAiCrossOpdOptions(): Promise<{ indikator: AiCrossOpdOption[]; tahun: string[] }> {
  const data = await request<{ data: AiCrossOpdOption[]; tahun: string[] }>('/admin/ai/cross-opd/options');
  return { indikator: data.data, tahun: data.tahun };
}

export async function fetchAiCrossOpd(kode: string, tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/cross-opd?${qs}`);
  return data.data;
}

export async function generateAiCrossOpd(kode: string, tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/cross-opd', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun }),
  });
  return data.data;
}

export async function deleteAiCrossOpd(kode: string, tahun: string): Promise<void> {
  await request('/admin/ai/cross-opd', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun }),
  });
}

// ── P10: Executive Brief (AI, chaining dari hasil analisis per indikator) ──
export async function fetchAiExecBriefOptions(): Promise<{ indikator: AiIndikatorOption[]; tahun: string[]; sumber: AiSumberOption[] }> {
  const data = await request<{ data: AiIndikatorOption[]; tahun: string[]; sumber: AiSumberOption[] }>('/admin/ai/executive-brief/options');
  return { indikator: data.data, tahun: data.tahun, sumber: data.sumber };
}

export async function fetchAiExecBriefStatus(kode: string, tahun: string): Promise<AiCorrectiveStatus> {
  const qs = new URLSearchParams({ kode, tahun }).toString();
  return request<AiCorrectiveStatus>(`/admin/ai/executive-brief?${qs}`);
}

export async function generateAiExecBrief(kode: string, tahun: string, sumber: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/executive-brief', {
    method: 'POST',
    body: JSON.stringify({ kode, tahun, sumber }),
  });
  return data.data;
}

export async function deleteAiExecBrief(kode: string, tahun: string, sumber: string): Promise<void> {
  await request('/admin/ai/executive-brief', {
    method: 'DELETE',
    body: JSON.stringify({ kode, tahun, sumber }),
  });
}

// ── P12: Cross-Pillar Strategic Synthesis (AI, seluruh pilar sekaligus) ──
export async function fetchAiCrossPillarOptions(): Promise<{ tahun: string[] }> {
  const data = await request<{ tahun: string[] }>('/admin/ai/cross-pillar/options');
  return { tahun: data.tahun };
}

export async function fetchAiCrossPillar(tahun: string): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ tahun }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/cross-pillar?${qs}`);
  return data.data;
}

export async function generateAiCrossPillar(tahun: string): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/cross-pillar', {
    method: 'POST',
    body: JSON.stringify({ tahun }),
  });
  return data.data;
}

export async function deleteAiCrossPillar(tahun: string): Promise<void> {
  await request('/admin/ai/cross-pillar', {
    method: 'DELETE',
    body: JSON.stringify({ tahun }),
  });
}

// ── P13: Innovation Miner (AI, per renaksi/kegiatan) ──
export interface AiRenaksiOption {
  id: number;
  rencana_aksi: string;
  program: string | null;
  opd: string | null;
  status: string | null;
}

export async function fetchAiInnovationTahun(): Promise<string[]> {
  const data = await request<{ tahun: string[] }>('/admin/ai/innovation/tahun-options');
  return data.tahun;
}

export async function fetchAiInnovationOptions(tahun: string): Promise<AiRenaksiOption[]> {
  const qs = new URLSearchParams({ tahun }).toString();
  const data = await request<{ data: AiRenaksiOption[] }>(`/admin/ai/innovation/options?${qs}`);
  return data.data;
}

export async function fetchAiInnovation(renaksiId: number): Promise<AiIndikatorResult | null> {
  const qs = new URLSearchParams({ renaksi_id: String(renaksiId) }).toString();
  const data = await request<{ data: AiIndikatorResult | null }>(`/admin/ai/innovation?${qs}`);
  return data.data;
}

export async function generateAiInnovation(renaksiId: number): Promise<AiIndikatorResult> {
  const data = await request<{ data: AiIndikatorResult }>('/admin/ai/innovation', {
    method: 'POST',
    body: JSON.stringify({ renaksi_id: renaksiId }),
  });
  return data.data;
}

export async function deleteAiInnovation(renaksiId: number): Promise<void> {
  await request('/admin/ai/innovation', {
    method: 'DELETE',
    body: JSON.stringify({ renaksi_id: renaksiId }),
  });
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
  username: string | null;
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
  username: string;
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

// ── Kelola OPD (khusus super admin) ───────────────

export interface AdminOpdRow {
  id: number;
  kode_opd: string | null;
  nama_opd: string;
  singkatan: string | null;
  indikator_count: number;
  renaksi_count: number;
  user_count: number;
}

export interface OpdPayload {
  nama_opd: string;
  kode_opd?: string | null;
  singkatan?: string | null;
}

export async function fetchAdminOpds(search?: string): Promise<AdminOpdRow[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await request<{ data: AdminOpdRow[] }>(`/admin/opds${qs}`);
  return data.data;
}

export async function createOpd(payload: OpdPayload): Promise<void> {
  await request('/admin/opds', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateOpd(id: number, payload: OpdPayload): Promise<void> {
  await request(`/admin/opds/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteOpd(id: number): Promise<void> {
  await request(`/admin/opds/${id}`, { method: 'DELETE' });
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
  target_max?: number | null;
  capaian?: number | null;
  arah_target?: string | null;
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
