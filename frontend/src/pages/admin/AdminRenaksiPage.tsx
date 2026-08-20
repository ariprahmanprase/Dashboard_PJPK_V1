import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Pencil, Search, X, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import {
  fetchAdminRenaksi,
  fetchIndikatorOptions,
  fetchSatuanOptions,
  updateRenaksi,
  type AdminRenaksi,
  type AdminUser,
  type IndikatorOption,
  type RenaksiUpdatePayload,
} from '@/services/admin';

interface Props {
  user: AdminUser;
  onLogout: () => void;
  onNavigate: (page: AdminPageName) => void;
}

const TAHUN_OPTIONS = ['2025', '2026', '2027', '2028', '2029'];

const selectStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

export default function AdminRenaksiPage({ user, onLogout, onNavigate }: Props) {
  const isSuperAdmin = user.role === 'super_admin';
  const [items, setItems] = useState<AdminRenaksi[]>([]);
  const [indikatorOptions, setIndikatorOptions] = useState<IndikatorOption[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahun, setTahun] = useState('2025');
  const [indikatorId, setIndikatorId] = useState('');
  const [dinas, setDinas] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<AdminRenaksi | null>(null);
  const [editing, setEditing] = useState<AdminRenaksi | null>(null);

  useEffect(() => {
    fetchIndikatorOptions()
      .then(setIndikatorOptions)
      .catch(() => setIndikatorOptions([]));
    fetchSatuanOptions()
      .then(setSatuanOptions)
      .catch(() => setSatuanOptions([]));
  }, []);

  // Opsi dinas: renaksi tanpa filter dinas (super admin saja; admin OPD otomatis terscope backend)
  const [dinasOptions, setDinasOptions] = useState<string[]>([]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchAdminRenaksi({ tahun })
      .then((list) => {
        const names = Array.from(new Set(list.map((r) => r.dinas).filter((d) => d && d !== '-')));
        names.sort((a, b) => a.localeCompare(b, 'id'));
        setDinasOptions(names);
      })
      .catch(() => setDinasOptions([]));
  }, [isSuperAdmin, tahun]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await fetchAdminRenaksi({
          tahun,
          search: search || undefined,
          indikator_id: indikatorId ? Number(indikatorId) : undefined,
          status: status || undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [tahun, search, indikatorId, status]);

  // Filter dinas di client (super admin) — backend hanya menerima opd_id, dinas_options bertipe teks
  const visibleItems = dinas ? items.filter((r) => r.dinas === dinas) : items;

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminLayout
      user={user}
      activePage="renaksi"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Pengisian Rencana Aksi"
    >
      <div className="mx-auto max-w-[1600px] flex flex-col items-stretch gap-6">
        {/* Filter bar */}
        <div
          className="w-full rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm w-full sm:w-auto"
            style={selectStyle}
          >
            {TAHUN_OPTIONS.map((t) => (
              <option key={t} value={t}>Tahun {t}</option>
            ))}
          </select>

          <select
            value={indikatorId}
            onChange={(e) => setIndikatorId(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm w-full sm:w-auto sm:min-w-56"
            style={selectStyle}
          >
            <option value="">Semua Indikator</option>
            {indikatorOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nama_indikator.length > 50 ? i.nama_indikator.slice(0, 50) + '…' : i.nama_indikator}
              </option>
            ))}
          </select>

          {isSuperAdmin && (
            <select
              value={dinas}
              onChange={(e) => setDinas(e.target.value)}
              className="rounded-lg border px-4 py-3 text-sm w-full sm:w-auto sm:min-w-48"
              style={selectStyle}
            >
              <option value="">Semua Dinas</option>
              {dinasOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm w-full sm:w-auto"
            style={selectStyle}
          >
            <option value="">Semua Status</option>
            <option value="Terlaksana">Terlaksana</option>
            <option value="Tidak Terlaksana">Tidak Terlaksana</option>
          </select>

          <div className="relative flex-1 sm:min-w-60">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari rencana aksi / program…"
              className="rounded-lg border pl-11 pr-4 py-3 text-sm w-full"
              style={selectStyle}
            />
          </div>

          <span
            className="text-xs sm:text-sm whitespace-nowrap sm:ml-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {loading ? 'Memuat…' : `${visibleItems.length} renaksi`}
          </span>
        </div>

        {error && (
          <p
            className="text-sm rounded-xl px-5 py-4"
            style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}
          >
            {error}
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div
            className="rounded-xl border flex items-center justify-center py-28"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : visibleItems.length === 0 ? (
          <div
            className="rounded-xl border text-center py-28 px-6 text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Tidak ada renaksi untuk filter ini.
          </div>
        ) : (
          <>
            {/* Kartu (mobile & tablet) */}
            <div className="w-full flex flex-col gap-6 lg:hidden">
              {visibleItems.map((r) => (
                <RenaksiCard key={r.id} item={r} onEdit={() => setEditing(r)} />
              ))}
            </div>

            {/* Tabel (desktop) — disamakan dengan tabel menu Rencana Aksi */}
            <div
              className="hidden lg:block w-full rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 1200 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['No', 'Dinas', 'Kode Program', 'Rencana Aksi', 'Tahun', 'Target', 'Realisasi', 'Indikator', 'Status', 'Aksi'].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium uppercase tracking-wider"
                          style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.688rem',
                            padding: '0.875rem 1.25rem',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((r) => (
                      <tr
                        key={r.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                        onClick={() => setViewing(r)}
                      >
                        <td
                          className="align-middle"
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}
                        >
                          {r.no}
                        </td>
                        <td
                          className="align-middle"
                          style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 120 }}
                        >
                          <span className="line-clamp-2">{r.dinas}</span>
                        </td>
                        <td
                          className="align-middle font-mono"
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem', maxWidth: 100 }}
                        >
                          <span className="line-clamp-2">{r.kode_program ?? '-'}</span>
                        </td>
                        <td
                          className="align-middle font-medium"
                          style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 280 }}
                        >
                          <span className="line-clamp-2">{r.rencana_aksi}</span>
                        </td>
                        <td
                          className="align-middle font-mono"
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}
                        >
                          {r.tahun}
                        </td>
                        <td
                          className="align-middle"
                          style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 150 }}
                        >
                          <span className="line-clamp-2">{formatNilai(r, 'target')}</span>
                        </td>
                        <td
                          className="align-middle"
                          style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 150 }}
                        >
                          <span className="line-clamp-2">{formatNilai(r, 'realisasi')}</span>
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem', maxWidth: 180 }}>
                          {r.indikator && r.indikator.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.indikator.slice(0, 2).map((ind, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-0.5 rounded text-xs"
                                  style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
                                >
                                  {ind}
                                </span>
                              ))}
                              {r.indikator.length > 2 && (
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-xs"
                                  style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
                                >
                                  +{r.indikator.length - 2}
                                </span>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                          <StatusPill status={r.status} />
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(r);
                            }}
                            className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 0.875rem' }}
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal detail (klik baris) — seperti modal tabel Rencana Aksi di dashboard */}
      {viewing && !editing && (
        <DetailModal item={viewing} onClose={() => setViewing(null)} />
      )}

      {editing && (
        <EditModal
          item={editing}
          isSuperAdmin={isSuperAdmin}
          indikatorOptions={indikatorOptions}
          satuanOptions={satuanOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}

function RenaksiCard({ item, onEdit }: { item: AdminRenaksi; onEdit: () => void }) {
  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-6"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            #{item.no} · {item.dinas}
            {item.kode_program && item.kode_program !== '-' ? ` · ${item.kode_program}` : ''}
          </p>
          <p className="text-sm font-medium mt-2.5 leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {item.rencana_aksi}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Target</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {formatNilai(item, 'target')}
          </p>
        </div>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Realisasi</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {formatNilai(item, 'realisasi')}
          </p>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        <Pencil size={14} /> Isi Realisasi
      </button>
    </div>
  );
}

function formatNilai(r: AdminRenaksi, field: 'target' | 'realisasi'): string {
  if (r.jenis_target === 'kuantitatif') {
    const nilai = field === 'target' ? r.target_nilai : r.realisasi_nilai;
    if (nilai === null) return '-';
    const num = Number(nilai);
    const formatted = Number.isInteger(num)
      ? num.toLocaleString('id-ID')
      : num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return r.target_satuan ? `${formatted} ${r.target_satuan}` : formatted;
  }
  const teks = field === 'target' ? r.target : r.realisasi;
  return teks && teks !== '-' ? teks : '-';
}

function StatusPill({ status }: { status: string }) {
  const ok = status === 'Terlaksana';
  return (
    <span
      className="inline-flex items-center font-medium rounded-lg whitespace-nowrap shrink-0"
      style={{
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        backgroundColor: ok ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        color: ok ? '#16a34a' : '#dc2626',
      }}
    >
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      <span className="ml-1">{status}</span>
    </span>
  );
}

// ── Modal detail (klik baris) — gaya RenaksiProgramModal dashboard ──
function DetailModal({ item, onClose }: { item: AdminRenaksi; onClose: () => void }) {
  const ok = item.status === 'Terlaksana';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full mx-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          maxWidth: 700,
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: ok ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
            >
              {ok ? (
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
              ) : (
                <XCircle size={20} style={{ color: '#dc2626' }} />
              )}
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {item.dinas} — {item.kode_program ?? '-'} — Tahun {item.tahun}
              </p>
              <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                {item.rencana_aksi}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 80px)', padding: '1.5rem' }}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Target
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {formatNilai(item, 'target')}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Realisasi
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {formatNilai(item, 'realisasi')}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Status
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: ok ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: ok ? '#16a34a' : '#dc2626',
              }}
            >
              {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {item.status}
            </span>
          </div>

          <div
            className="grid grid-cols-3 gap-6 pt-6"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Kendala
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                {item.kendala || '-'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Catatan
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                {item.catatan || '-'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Indikator Terkait
              </p>
              {item.indikator && item.indikator.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.indikator.map((ind, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>-</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ──────────────────────────────────────
interface EditModalProps {
  item: AdminRenaksi;
  isSuperAdmin: boolean;
  indikatorOptions: IndikatorOption[];
  satuanOptions: string[];
  onClose: () => void;
  onSaved: () => void;
}

const SATUAN_CUSTOM = '__custom__';

function EditModal({ item, isSuperAdmin, indikatorOptions, satuanOptions, onClose, onSaved }: EditModalProps) {
  const isKuantitatif = item.jenis_target === 'kuantitatif';
  const [status, setStatus] = useState(item.status);
  const [realisasiNilai, setRealisasiNilai] = useState(item.realisasi_nilai ?? '');
  const [realisasiTeks, setRealisasiTeks] = useState(item.realisasi ?? '');
  const [targetNilai, setTargetNilai] = useState(item.target_nilai ?? '');
  // Satuan: dropdown dari satuan yang sudah ada + opsi "Tambahkan satuan…" (input custom)
  const [satuanChoice, setSatuanChoice] = useState<string>(() =>
    item.target_satuan && !satuanOptions.includes(item.target_satuan) ? SATUAN_CUSTOM : (item.target_satuan ?? ''),
  );
  const [satuanCustom, setSatuanCustom] = useState<string>(() =>
    item.target_satuan && !satuanOptions.includes(item.target_satuan) ? item.target_satuan : '',
  );
  const [targetTeks, setTargetTeks] = useState(item.target ?? '');
  const [kendala, setKendala] = useState(item.kendala ?? '');
  const [catatan, setCatatan] = useState(item.catatan ?? '');
  const [indikatorIds, setIndikatorIds] = useState<(number | '')[]>(() => {
    const ids = item.indikator_ids ?? [];
    return [ids[0] ?? '', ids[1] ?? '', ids[2] ?? '', ids[3] ?? ''];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: RenaksiUpdatePayload = {
      status,
      kendala: kendala || null,
      catatan: catatan || null,
    };
    if (isKuantitatif) {
      payload.realisasi_nilai = realisasiNilai === '' ? null : Number(realisasiNilai);
    } else {
      payload.realisasi = realisasiTeks || null;
    }
    if (isSuperAdmin) {
      if (isKuantitatif) {
        payload.target_nilai = targetNilai === '' ? null : Number(targetNilai);
        payload.target_satuan =
          satuanChoice === SATUAN_CUSTOM ? satuanCustom.trim() || null : satuanChoice || null;
      } else {
        payload.target = targetTeks || null;
      }
      payload.indikator_ids = indikatorIds.filter((v): v is number => v !== '');
    }

    try {
      await updateRenaksi(item.id, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
      setSaving(false);
    }
  };

  const inputClass =
    'rounded-lg border px-4 py-3 text-sm w-full outline-none transition-shadow focus:ring-2 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed';
  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border max-h-[92vh] flex flex-col"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal (tetap terlihat saat scroll) */}
        <div
          className="flex items-start justify-between gap-6 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Isi Realisasi
            </h2>
            <p className="text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {item.dinas} · {item.tahun} · {item.rencana_aksi}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body modal (scrollable) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-8 py-7 flex flex-col gap-7">
          {/* Target (read-only untuk admin OPD) */}
          {isKuantitatif ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={`Target (${isSuperAdmin ? 'boleh diubah' : 'ditetapkan pusat'})`}>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={targetNilai}
                  onChange={(e) => setTargetNilai(e.target.value)}
                  disabled={!isSuperAdmin}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Satuan">
                <select
                  value={satuanChoice}
                  onChange={(e) => setSatuanChoice(e.target.value)}
                  disabled={!isSuperAdmin}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">— Pilih satuan —</option>
                  {satuanOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {isSuperAdmin && <option value={SATUAN_CUSTOM}>＋ Tambahkan satuan…</option>}
                </select>
                {isSuperAdmin && satuanChoice === SATUAN_CUSTOM && (
                  <input
                    value={satuanCustom}
                    onChange={(e) => setSatuanCustom(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Ketik satuan baru, mis. Dokumen"
                    autoFocus
                  />
                )}
              </Field>
            </div>
          ) : (
            <Field label={`Target kualitatif (${isSuperAdmin ? 'boleh diubah' : 'ditetapkan pusat'})`}>
              <textarea
                value={targetTeks}
                onChange={(e) => setTargetTeks(e.target.value)}
                disabled={!isSuperAdmin}
                rows={2}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          )}

          {/* Realisasi */}
          {isKuantitatif ? (
            <Field label={`Realisasi${item.target_satuan ? ` (${item.target_satuan})` : ''}`}>
              <input
                type="number"
                step="any"
                min="0"
                value={realisasiNilai}
                onChange={(e) => setRealisasiNilai(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="0"
              />
            </Field>
          ) : (
            <Field label="Realisasi">
              <textarea
                value={realisasiTeks}
                onChange={(e) => setRealisasiTeks(e.target.value)}
                rows={3}
                className={inputClass}
                style={inputStyle}
                placeholder="Uraian realisasi…"
              />
            </Field>
          )}

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminRenaksi['status'])}
              className={inputClass}
              style={inputStyle}
            >
              <option value="Terlaksana">Terlaksana</option>
              <option value="Tidak Terlaksana">Tidak Terlaksana</option>
            </select>
          </Field>

          {/* Tautan indikator — super admin boleh mengubah */}
          {isSuperAdmin && (
            <Field label="Indikator terkait (maks. 4, kosongkan untuk menghapus)">
              <div className="flex flex-col gap-3">
                {indikatorIds.map((val, slot) => (
                  <select
                    key={slot}
                    value={val}
                    onChange={(e) =>
                      setIndikatorIds((prev) => {
                        const next = [...prev];
                        next[slot] = e.target.value === '' ? '' : Number(e.target.value);
                        return next;
                      })
                    }
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">— Slot {slot + 1}: kosong —</option>
                    {indikatorOptions.map((i) => (
                      <option
                        key={i.id}
                        value={i.id}
                        disabled={indikatorIds.includes(i.id) && val !== i.id}
                      >
                        {i.kode ? `${i.kode} — ` : ''}{i.nama_indikator}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </Field>
          )}

          <Field label="Kendala (opsional)">
            <textarea
              value={kendala}
              onChange={(e) => setKendala(e.target.value)}
              rows={3}
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <Field label="Catatan (opsional)">
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          {error && (
            <p
              className="text-sm rounded-lg px-4 py-3.5 leading-relaxed"
              style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-3 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving && <Loader2 className="animate-spin" size={14} />}
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
