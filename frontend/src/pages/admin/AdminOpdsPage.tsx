import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import {
  createOpd,
  deleteOpd,
  fetchAdminOpds,
  updateOpd,
  type AdminOpdRow,
  type AdminUser,
  type OpdPayload,
} from '@/services/admin';

interface Props {
  user: AdminUser;
  onLogout: () => void;
  onNavigate: (page: AdminPageName) => void;
}

const selectStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

export default function AdminOpdsPage({ user, onLogout, onNavigate }: Props) {
  const [items, setItems] = useState<AdminOpdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminOpdRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminOpdRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminOpds(search || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminLayout
      user={user}
      activePage="opds"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Kelola OPD"
    >
      <div className="mx-auto max-w-[1600px] flex flex-col items-stretch gap-6">
        {/* Filter bar */}
        <div
          className="w-full rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="relative flex-1 sm:min-w-60">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / kode / singkatan…"
              className="rounded-lg border pl-11 pr-4 py-3 text-sm w-full"
              style={selectStyle}
            />
          </div>

          <span className="text-xs sm:text-sm whitespace-nowrap sm:ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {loading ? 'Memuat…' : `${items.length} OPD`}
          </span>

          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Tambah OPD
          </button>
        </div>

        {error && (
          <p className="text-sm rounded-xl px-5 py-4" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
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
            className="rounded-xl border flex flex-col items-center justify-center py-28 px-6 gap-3"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Building2 size={40} style={{ opacity: 0.4 }} />
            <p className="text-sm">Tidak ada OPD untuk pencarian ini.</p>
          </div>
        ) : (
          <>
            {/* Kartu (mobile & tablet) */}
            <div className="w-full flex flex-col gap-6 lg:hidden">
              {items.map((o) => (
                <OpdCard
                  key={o.id}
                  item={o}
                  onEdit={() => setEditing(o)}
                  onDelete={() => setDeleting(o)}
                />
              ))}
            </div>

            {/* Tabel (desktop) */}
            <div
              className="hidden lg:block w-full rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 860 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Nama OPD', 'Singkatan', 'Kode', 'Dipakai', 'Aksi'].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((o) => (
                      <tr
                        key={o.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                      >
                        <td className="align-middle font-medium" style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 340 }}>
                          <span className="line-clamp-2">{o.nama_opd}</span>
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                          {o.singkatan ? (
                            <span
                              className="inline-flex items-center rounded-lg font-medium whitespace-nowrap"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
                            >
                              {o.singkatan}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>—</span>
                          )}
                        </td>
                        <td className="align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 220 }}>
                          <span className="line-clamp-2">{o.kode_opd ?? '—'}</span>
                        </td>
                        <td className="align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}>
                          {o.indikator_count > 0 || o.renaksi_count > 0 || o.user_count > 0 ? (
                            <span className="whitespace-nowrap">
                              {o.indikator_count} indikator · {o.renaksi_count} renaksi · {o.user_count} user
                            </span>
                          ) : (
                            <span style={{ opacity: 0.7 }}>Belum dipakai</span>
                          )}
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditing(o)}
                              className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 0.875rem' }}
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleting(o)}
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
          </>
        )}
      </div>

      {/* Modal tambah */}
      {creating && (
        <OpdFormModal
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}

      {/* Modal edit */}
      {editing && (
        <OpdFormModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {/* Modal konfirmasi hapus */}
      {deleting && (
        <DeleteConfirmModal
          item={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load(); }}
        />
      )}
    </AdminLayout>
  );
}

function OpdCard({
  item, onEdit, onDelete,
}: {
  item: AdminOpdRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-5"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{item.nama_opd}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {item.singkatan ? <span className="font-medium" style={{ color: '#059669' }}>{item.singkatan}</span> : null}
            {item.singkatan && item.kode_opd ? ' · ' : ''}{item.kode_opd ?? ''}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
            {item.indikator_count} indikator · {item.renaksi_count} renaksi · {item.user_count} user
          </p>
        </div>
        <Building2 size={20} style={{ color: 'var(--color-text-secondary)', opacity: 0.4, flexShrink: 0 }} />
      </div>
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
          style={{ borderColor: 'var(--color-border)', color: '#dc2626' }}
        >
          <Trash2 size={14} /> Hapus
        </button>
      </div>
    </div>
  );
}

// ── Modal form (tambah / edit) ─────────────────────
function OpdFormModal({
  item, onClose, onSaved,
}: {
  item?: AdminOpdRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!item;
  const [namaOpd, setNamaOpd] = useState(item?.nama_opd ?? '');
  const [kodeOpd, setKodeOpd] = useState(item?.kode_opd ?? '');
  const [singkatan, setSingkatan] = useState(item?.singkatan ?? '');
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

    const payload: OpdPayload = {
      nama_opd: namaOpd.trim(),
      kode_opd: kodeOpd.trim() || null,
      singkatan: singkatan.trim() || null,
    };

    try {
      if (isEdit) {
        await updateOpd(item!.id, payload);
      } else {
        await createOpd(payload);
      }
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
        className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border max-h-[92vh] flex flex-col"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-6 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {isEdit ? 'Edit OPD' : 'Tambah OPD'}
            </h2>
            {isEdit && (
              <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {item!.nama_opd}
              </p>
            )}
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-8 py-7 flex flex-col gap-7">
          <Field label="Nama OPD">
            <input
              value={namaOpd}
              onChange={(e) => setNamaOpd(e.target.value)}
              required
              maxLength={150}
              placeholder="Mis. Dinas Perumahan dan Permukiman"
              className={inputClass}
              style={inputStyle}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Untuk OPD turunan/bidang, tulis dengan format: Nama Induk (Bidang …)
            </p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Singkatan (opsional)">
              <input
                value={singkatan}
                onChange={(e) => setSingkatan(e.target.value)}
                maxLength={30}
                placeholder="Mis. Disperkim"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Kode OPD (opsional)">
              <input
                value={kodeOpd}
                onChange={(e) => setKodeOpd(e.target.value)}
                maxLength={100}
                placeholder="Kode internal/referensi"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>

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

// ── Modal konfirmasi hapus ─────────────────────────
function DeleteConfirmModal({
  item, onClose, onDeleted,
}: {
  item: AdminOpdRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dipakai = item.indikator_count > 0 || item.renaksi_count > 0 || item.user_count > 0;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteOpd(item.id);
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
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Hapus OPD?</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{item.nama_opd}</strong> akan dihapus permanen.
          </p>
          {dipakai && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: '#b91c1c' }}>
              OPD ini masih dipakai {item.indikator_count} indikator, {item.renaksi_count} renaksi, dan {item.user_count} user — penghapusan akan ditolak server.
            </p>
          )}
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
