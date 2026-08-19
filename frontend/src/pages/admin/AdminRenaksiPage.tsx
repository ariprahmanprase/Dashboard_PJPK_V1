import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2, LogOut, Pencil, Search, X } from 'lucide-react';
import {
  fetchAdminRenaksi,
  logout,
  updateRenaksi,
  type AdminRenaksi,
  type AdminUser,
  type RenaksiUpdatePayload,
} from '@/services/admin';

interface Props {
  user: AdminUser;
  onLogout: () => void;
}

const TAHUN_OPTIONS = ['2025', '2026', '2027', '2028', '2029'];

export default function AdminRenaksiPage({ user, onLogout }: Props) {
  const [items, setItems] = useState<AdminRenaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahun, setTahun] = useState('2025');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminRenaksi | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminRenaksi({ tahun, search: search || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [tahun, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-5 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              Pengisian Rencana Aksi
            </h1>
            <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {user.name}
              {user.role === 'admin_opd' && user.opd_nama ? ` — ${user.opd_nama}` : ' — Super Admin'}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <a
              href="/"
              className="hidden sm:inline text-sm hover:underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Lihat dashboard →
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 sm:px-8 py-8 sm:py-10 flex flex-col items-center gap-8">
        {/* Filter bar */}
        <div
          className="w-full rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm w-full sm:w-auto"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {TAHUN_OPTIONS.map((t) => (
              <option key={t} value={t}>Tahun {t}</option>
            ))}
          </select>

          <div className="relative flex-1">
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
              style={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <span
            className="text-xs sm:text-sm whitespace-nowrap sm:ml-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {loading ? 'Memuat…' : `${items.length} renaksi`}
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
        ) : items.length === 0 ? (
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
              {items.map((r) => (
                <RenaksiCard key={r.id} item={r} onEdit={() => setEditing(r)} />
              ))}
            </div>

            {/* Tabel (desktop) */}
            <div
              className="hidden lg:block w-full rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['No', 'Dinas', 'Rencana Aksi', 'Target', 'Realisasi', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left font-medium uppercase tracking-wider px-7 py-5 text-xs"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td className="px-7 py-6 align-top" style={{ color: 'var(--color-text-secondary)' }}>
                        {r.no}
                      </td>
                      <td className="px-7 py-6 align-top whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                        {r.dinas}
                      </td>
                      <td className="px-7 py-6 align-top max-w-md">
                        <p className="line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                          {r.rencana_aksi}
                        </p>
                        {r.kode_program && r.kode_program !== '-' && (
                          <span className="text-xs mt-2 inline-block" style={{ color: 'var(--color-text-secondary)' }}>
                            {r.kode_program}
                          </span>
                        )}
                      </td>
                      <td className="px-7 py-6 align-top whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                        {formatNilai(r, 'target')}
                      </td>
                      <td className="px-7 py-6 align-top whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
                        {formatNilai(r, 'realisasi')}
                      </td>
                      <td className="px-7 py-6 align-top">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-7 py-6 align-top">
                        <button
                          onClick={() => setEditing(r)}
                          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        >
                          <Pencil size={13} /> Isi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {editing && (
        <EditModal
          item={editing}
          isSuperAdmin={user.role === 'super_admin'}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
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
      className="inline-block rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0"
      style={{
        backgroundColor: ok ? '#ecfdf5' : '#fef2f2',
        color: ok ? '#047857' : '#b91c1c',
      }}
    >
      {status}
    </span>
  );
}

// ── Edit modal ──────────────────────────────────────
interface EditModalProps {
  item: AdminRenaksi;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ item, isSuperAdmin, onClose, onSaved }: EditModalProps) {
  const isKuantitatif = item.jenis_target === 'kuantitatif';
  const [status, setStatus] = useState(item.status);
  const [realisasiNilai, setRealisasiNilai] = useState(item.realisasi_nilai ?? '');
  const [realisasiTeks, setRealisasiTeks] = useState(item.realisasi ?? '');
  const [targetNilai, setTargetNilai] = useState(item.target_nilai ?? '');
  const [targetSatuan, setTargetSatuan] = useState(item.target_satuan ?? '');
  const [targetTeks, setTargetTeks] = useState(item.target ?? '');
  const [kendala, setKendala] = useState(item.kendala ?? '');
  const [catatan, setCatatan] = useState(item.catatan ?? '');
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
        payload.target_satuan = targetSatuan || null;
      } else {
        payload.target = targetTeks || null;
      }
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
                <input
                  value={targetSatuan}
                  onChange={(e) => setTargetSatuan(e.target.value)}
                  disabled={!isSuperAdmin}
                  className={inputClass}
                  style={inputStyle}
                />
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
