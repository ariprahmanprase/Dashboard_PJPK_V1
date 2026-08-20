import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2, FileX, Pencil, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import FilterBar from '@/components/FilterBar';
import StatusBadge from '@/components/StatusBadge';
import IndikatorDetailModal from '@/components/IndikatorDetailModal';
import {
  deleteIndikator,
  fetchPilarOptions,
  fetchUserOpdOptions,
  updateIndikator,
  type AdminUser,
  type OpdOption,
  type PilarOption,
  type IndikatorUpdatePayload,
} from '@/services/admin';
import type { DashboardFilters, FilterOptions, TableRow } from '@/types';

async function apiFetch<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

interface Props {
  user: AdminUser;
  onLogout: () => void;
  onNavigate: (page: AdminPageName) => void;
}

// TableRow + field yang dibutuhkan form edit (nilai mentah)
type AdminTableRow = TableRow;

export default function AdminReportPage({ user, onLogout, onNavigate }: Props) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [pilarOptions, setPilarOptions] = useState<PilarOption[]>([]);
  const [opdOptions, setOpdOptions] = useState<OpdOption[]>([]);
  const [tableData, setTableData] = useState<AdminTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DashboardFilters>({ tahun: '2025' });
  const [detailKode, setDetailKode] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTableRow | null>(null);
  const [deleting, setDeleting] = useState<AdminTableRow | null>(null);

  useEffect(() => {
    apiFetch<FilterOptions>('/api/filters').then(setFilterOptions).catch(() => {});
    fetchPilarOptions().then(setPilarOptions).catch(() => setPilarOptions([]));
    fetchUserOpdOptions().then(setOpdOptions).catch(() => setOpdOptions([]));
  }, []);

  const load = useCallback(async (f: DashboardFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.tahun) params.set('tahun', f.tahun);
      if (f.opd_id) params.set('opd_id', f.opd_id);
      if (f.pilar_id) params.set('pilar_id', f.pilar_id);
      if (f.indikator_id) params.set('indikator_id', f.indikator_id);
      if (f.status_tl) params.set('status_tl', f.status_tl);
      const data = await apiFetch<AdminTableRow[]>(`/api/dashboard/table?${params}`);
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(key: keyof DashboardFilters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    load(next);
  }

  return (
    <AdminLayout
      user={user}
      activePage="report"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Admin Report"
    >
      <div className="mx-auto max-w-[1600px] flex flex-col items-stretch gap-6">
        {/* Filter — sama persis dengan dashboard Report */}
        <div
          className="w-full rounded-xl border p-5 sm:p-6"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <FilterBar options={filterOptions} filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {error && (
          <p className="text-sm rounded-xl px-5 py-4" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
            {error}
          </p>
        )}

        {/* Tabel — persis DataTable dashboard + kolom Aksi */}
        {loading ? (
          <div
            className="rounded-xl border flex items-center justify-center py-20"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : tableData.length === 0 ? (
          <div
            className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <FileX size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Tidak ada data yang sesuai dengan filter
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 1300 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Kode', 'Nama Indikator', 'Pilar', 'OPD', 'Tahun', 'Target', 'Capaian', 'Gap', 'Status', 'Aksi'].map((h) => {
                      const isNumeric = ['Target', 'Capaian', 'Gap'].includes(h);
                      return (
                        <th
                          key={h}
                          className={`font-medium uppercase tracking-wider ${isNumeric ? 'text-right' : 'text-left'}`}
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}
                        >
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr
                      key={`${row.kode}-${i}`}
                      style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setDetailKode(row.kode)}
                    >
                      <td className="font-mono align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.875rem 1.25rem' }}>
                        {row.kode}
                      </td>
                      <td
                        className="font-medium align-middle"
                        style={{
                          color: 'var(--color-text)', padding: '0.875rem 1.25rem', fontSize: '0.8125rem',
                          maxWidth: '260px', minWidth: '160px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3,
                        }}
                      >
                        {row.nama_indikator}
                      </td>
                      <td className="align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.875rem 1.25rem' }}>
                        {row.nama_pilar}
                      </td>
                      <td className="align-middle" style={{ color: 'var(--color-text-secondary)', padding: '0.875rem 1.25rem', fontSize: '0.75rem', maxWidth: '220px', wordWrap: 'break-word' }}>
                        {row.nama_opd}
                      </td>
                      <td className="font-mono align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.875rem 1.25rem' }}>
                        {row.tahun ?? '-'}
                      </td>
                      <td className="font-mono align-middle text-right" style={{ color: 'var(--color-text)', padding: '0.875rem 1.25rem', fontSize: '0.75rem' }}>
                        {row.target != null ? row.target.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="font-mono align-middle text-right" style={{ color: 'var(--color-text)', padding: '0.875rem 1.25rem', fontSize: '0.75rem' }}>
                        {row.capaian != null ? row.capaian.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="font-mono align-middle text-right" style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem' }}>
                        {row.gap != null ? (
                          <span
                            style={{
                              color:
                                row.status_tl === 'On Track' ? 'var(--color-success, #22c55e)' :
                                row.status_tl === 'Warning' ? 'var(--color-warning, #eab308)' :
                                'var(--color-danger, #ef4444)',
                            }}
                          >
                            {row.gap >= 0 ? '+' : ''}{row.gap.toLocaleString('id-ID')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="align-middle" style={{ padding: '1rem 1.5rem' }}>
                        <StatusBadge status={row.status_tl} warna={row.warna_tl} />
                      </td>
                      <td className="align-middle" style={{ padding: '0.875rem 1.25rem' }}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing(row); }}
                            className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 0.875rem' }}
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleting(row); }}
                            className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                            style={{ borderColor: 'var(--color-border)', color: '#dc2626', padding: '0.5rem 0.875rem' }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Popup detail — sama seperti klik baris di dashboard Report */}
      <IndikatorDetailModal
        open={detailKode !== null && !editing && !deleting}
        kode={detailKode ?? ''}
        onClose={() => setDetailKode(null)}
      />

      {/* Modal edit */}
      {editing && (
        <EditIndikatorModal
          row={editing}
          pilarOptions={pilarOptions}
          opdOptions={opdOptions}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(filters); }}
        />
      )}

      {/* Modal hapus */}
      {deleting && (
        <DeleteIndikatorModal
          row={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load(filters); }}
        />
      )}
    </AdminLayout>
  );
}

// ── Modal edit indikator + target/capaian ──────────
function EditIndikatorModal({
  row, pilarOptions, opdOptions, onClose, onSaved,
}: {
  row: AdminTableRow;
  pilarOptions: PilarOption[];
  opdOptions: OpdOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nama, setNama] = useState(row.nama_indikator);
  const [pilarId, setPilarId] = useState<string>(row.pilar_id ? String(row.pilar_id) : '');
  const [opdIds, setOpdIds] = useState<number[]>(row.opd_ids ?? []);
  const [sumberData, setSumberData] = useState(row.sumber_data ?? '');
  const [baseline, setBaseline] = useState(row.baseline_2024 != null ? String(row.baseline_2024) : '');
  const [dokrenda, setDokrenda] = useState(row.dokrenda ?? '');
  const [kendala, setKendala] = useState(row.kendala ?? '');
  const [inovasi, setInovasi] = useState(row.inovasi ?? '');
  const [target] = useState(row.target != null ? String(row.target) : '');
  const [capaian, setCapaian] = useState(row.capaian != null ? String(row.capaian) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'rounded-lg border px-4 py-3 text-sm w-full outline-none transition-shadow focus:ring-2 focus:ring-blue-200';
  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: IndikatorUpdatePayload = {
      nama_indikator: nama,
      pilar_id: pilarId ? Number(pilarId) : (row.pilar_id ?? 0),
      opd_ids: opdIds,
      sumber_data: sumberData || null,
      baseline_2024: baseline || null,
      dokrenda: dokrenda || null,
      kendala: kendala || null,
      inovasi: inovasi || null,
      tahun: row.tahun ?? '2025',
      target: target === '' ? null : Number(target),
      capaian: capaian === '' ? null : Number(capaian),
    };

    try {
      await updateIndikator(row.kode, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border max-h-[92vh] flex flex-col"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-6 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Edit Indikator</h2>
            <p className="text-xs sm:text-sm mt-2 font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              {row.kode} · Tahun {row.tahun ?? '2025'}
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-8 py-7 flex flex-col gap-6">
          <Field label="Nama Indikator">
            <textarea value={nama} onChange={(e) => setNama(e.target.value)} rows={2} required className={inputClass} style={inputStyle} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Pilar">
              <select value={pilarId} onChange={(e) => setPilarId(e.target.value)} required className={inputClass} style={inputStyle}>
                <option value="">— Pilih pilar —</option>
                {pilarOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.no_pilar}. {p.nama_pilar}</option>
                ))}
              </select>
            </Field>
            <Field label={`Target ${row.tahun ?? '2025'} (ditetapkan pusat)`}>
              <input
                type="number"
                step="any"
                value={target}
                disabled
                readOnly
                className={inputClass}
                style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
              />
            </Field>
            <Field label={`Capaian ${row.tahun ?? '2025'}`}>
              <input type="number" step="any" value={capaian} onChange={(e) => setCapaian(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
          </div>

          {/* OPD terkait — multi-select chip */}
          <Field label="OPD / Dinas terkait">
            <div
              className="rounded-lg border p-3 flex flex-wrap gap-2 max-h-44 overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
              {opdOptions.length === 0 ? (
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Memuat OPD…</span>
              ) : (
                opdOptions.map((o) => {
                  const active = opdIds.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() =>
                        setOpdIds((prev) =>
                          prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id],
                        )
                      }
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                        color: active ? '#2563eb' : 'var(--color-text-secondary)',
                      }}
                    >
                      {o.nama_opd}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {opdIds.length} OPD dipilih
            </p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Sumber Data">
              <input value={sumberData} onChange={(e) => setSumberData(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Baseline 2024">
              <input value={baseline} onChange={(e) => setBaseline(e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
          </div>

          <Field label="Dokrenda">
            <textarea value={dokrenda} onChange={(e) => setDokrenda(e.target.value)} rows={2} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Kendala">
            <textarea value={kendala} onChange={(e) => setKendala(e.target.value)} rows={2} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Inovasi">
            <textarea value={inovasi} onChange={(e) => setInovasi(e.target.value)} rows={2} className={inputClass} style={inputStyle} />
          </Field>

          {error && (
            <p className="text-sm rounded-lg px-4 py-3.5 leading-relaxed" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
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

// ── Modal konfirmasi hapus indikator ───────────────
function DeleteIndikatorModal({
  row, onClose, onDeleted,
}: {
  row: AdminTableRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteIndikator(row.kode);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus.');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-2xl border p-7 flex flex-col gap-5"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Hapus indikator?</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{row.kode} — {row.nama_indikator}</strong> beserta
            seluruh data target/capaian di semua tahun akan dihapus permanen. Tautan indikator di rencana aksi
            ikut dilepas.
          </p>
        </div>

        {error && (
          <p className="text-sm rounded-lg px-4 py-3.5" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#dc2626' }}
          >
            {deleting && <Loader2 className="animate-spin" size={14} />}
            {deleting ? 'Menghapus…' : 'Ya, hapus'}
          </button>
        </div>
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
