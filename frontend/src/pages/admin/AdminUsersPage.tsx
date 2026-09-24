import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Pencil, Plus, Search, Trash2, UserCheck, Users, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import ConfirmCloseModal from '@/components/admin/ConfirmCloseModal';
import {
  createUser,
  deleteUser,
  fetchAdminUsers,
  fetchUserOpdOptions,
  updateUser,
  type AdminUser,
  type AdminUserRow,
  type OpdOption,
  type UserPayload,
} from '@/services/admin';
import OpdSearchSelect from '@/components/admin/OpdSearchSelect';
import { opdInduk } from '@/lib/opd';

/** Sentinel untuk opsi "+ Bidang baru" di dropdown bidang */
const BIDANG_BARU = '__bidang_baru__';

/** Normalisasi nama OPD ke dinas induknya — untuk mengelompokkan bidang per dinas */
function indukDari(namaOpd: string): string {
  return opdInduk(namaOpd);
}

/** Ambil nama bidang dari nama OPD turunan: "Dinkopum (Bidang HI)" -> "Bidang HI" */
function bidangDari(namaOpd: string): string | null {
  const induk = opdInduk(namaOpd);
  if (induk === namaOpd.trim()) return null;
  const m = namaOpd.match(/\((.+)\)/);
  return m ? m[1].trim() : null;
}

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

export default function AdminUsersPage({ user, onLogout, onNavigate }: Props) {
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [opdOptions, setOpdOptions] = useState<OpdOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [opdId, setOpdId] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    fetchUserOpdOptions()
      .then(setOpdOptions)
      .catch(() => setOpdOptions([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(
        await fetchAdminUsers({
          role: role || undefined,
          opd_id: opdId ? Number(opdId) : undefined,
          search: search || undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [role, opdId, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminLayout
      user={user}
      activePage="users"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Kelola User"
    >
      <div className="mx-auto max-w-[1600px] flex flex-col items-stretch gap-6">
        {/* Filter bar */}
        <div
          className="w-full rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm w-full sm:w-auto"
            style={selectStyle}
          >
            <option value="">Semua Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin_opd">Admin OPD</option>
            <option value="admin_analis">Admin Analis</option>
          </select>

          <OpdSearchSelect
            options={opdOptions}
            value={opdId}
            onChange={setOpdId}
            emptyLabel="Semua OPD"
            placeholder="Semua OPD"
            className="w-full sm:w-auto sm:min-w-52"
          />

          <div className="relative flex-1 sm:min-w-60">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / username / email…"
              className="rounded-lg border pl-11 pr-4 py-3 text-sm w-full"
              style={selectStyle}
            />
          </div>

          <span className="text-xs sm:text-sm whitespace-nowrap sm:ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {loading ? 'Memuat…' : `${items.length} user`}
          </span>

          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={15} /> Tambah User
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
            <Users size={40} style={{ opacity: 0.4 }} />
            <p className="text-sm">Tidak ada user untuk filter ini.</p>
          </div>
        ) : (
          <>
            {/* Kartu (mobile & tablet) */}
            <div className="w-full flex flex-col gap-6 lg:hidden">
              {items.map((u) => (
                <UserCard
                  key={u.id}
                  item={u}
                  isSelf={u.id === user.id}
                  onEdit={() => setEditing(u)}
                  onDelete={() => setDeleting(u)}
                />
              ))}
            </div>

            {/* Tabel (desktop) */}
            <div
              className="hidden lg:block w-full rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 900 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Nama', 'Username', 'Email', 'Jabatan', 'Role', 'OPD / Dinas', 'Bidang', 'Aksi'].map((h) => (
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
                    {items.map((u) => (
                      <tr
                        key={u.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                      >
                        <td className="align-middle font-medium" style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem' }}>
                          {u.name}
                          {u.id === user.id && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                              (Anda)
                            </span>
                          )}
                        </td>
                        <td className="align-middle font-mono" style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem' }}>
                          {u.username ?? '—'}
                        </td>
                        <td className="align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem' }}>
                          {u.email}
                        </td>
                        <td className="align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem' }}>
                          {u.jabatan ?? '—'}
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="align-middle" style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 220 }}>
                          <span className="line-clamp-2">{u.opd_nama ? opdInduk(u.opd_nama) : '—'}</span>
                        </td>
                        <td className="align-middle" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 180 }}>
                          <span className="line-clamp-2">{u.bidang ?? '—'}</span>
                        </td>
                        <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditing(u)}
                              className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 0.875rem' }}
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleting(u)}
                              disabled={u.id === user.id}
                              className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
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
        <UserFormModal
          opdOptions={opdOptions}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}

      {/* Modal edit */}
      {editing && (
        <UserFormModal
          item={editing}
          isSelf={editing.id === user.id}
          opdOptions={opdOptions}
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

function RoleBadge({ role }: { role: AdminUserRow['role'] }) {
  const style =
    role === 'super_admin'
      ? { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', label: 'Super Admin' }
      : role === 'admin_analis'
        ? { bg: 'rgba(168, 85, 247, 0.12)', color: '#9333ea', label: 'Admin Analis' }
        : { bg: 'rgba(100, 116, 139, 0.12)', color: 'var(--color-text-secondary)', label: 'Admin OPD' };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg font-medium whitespace-nowrap"
      style={{
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {role === 'super_admin' ? <UserCheck size={12} /> : <Users size={12} />}
      {style.label}
    </span>
  );
}

function UserCard({
  item, isSelf, onEdit, onDelete,
}: {
  item: AdminUserRow;
  isSelf: boolean;
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
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {item.name} {isSelf && <span className="text-[10px] uppercase" style={{ color: 'var(--color-text-secondary)' }}>(Anda)</span>}
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {item.username ? <span className="font-mono" style={{ color: 'var(--color-text)' }}>{item.username}</span> : null}
            {item.username ? ' · ' : ''}{item.email}
          </p>
          {item.jabatan && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{item.jabatan}</p>
          )}
          {item.opd_nama && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{opdInduk(item.opd_nama)}</p>
          )}
        </div>
        <RoleBadge role={item.role} />
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
          disabled={isSelf}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--color-border)', color: '#dc2626' }}
        >
          <Trash2 size={14} /> Hapus
        </button>
      </div>
    </div>
  );
}

// ── Modal form (tambah / edit) ─────────────────────
interface UserFormModalProps {
  item?: AdminUserRow;
  isSelf?: boolean;
  opdOptions: OpdOption[];
  onClose: () => void;
  onSaved: () => void;
}

function UserFormModal({ item, isSelf, opdOptions, onClose, onSaved }: UserFormModalProps) {
  const isEdit = !!item;
  const [name, setName] = useState(item?.name ?? '');
  const [username, setUsername] = useState(item?.username ?? '');
  const [email, setEmail] = useState(item?.email ?? '');
  const [password, setPassword] = useState('');
  const [jabatan, setJabatan] = useState(item?.jabatan ?? '');
  const [role, setRole] = useState<'super_admin' | 'admin_opd' | 'admin_analis'>(item?.role ?? 'admin_opd');

  // OPD yang dipilih = id OPD (nama lengkap bisa mengandung koma — tidak aman sebagai value)
  const [opdId, setOpdId] = useState<string>(() =>
    item?.opd_id ? String(item.opd_id) : '',
  );
  // Bidang: label bidang yang ada, atau BIDANG_BARU utk input teks baru
  const [bidangChoice, setBidangChoice] = useState<string>(() => {
    if (item?.bidang) {
      return item.bidang; // dicocokkan ke opsi di bawah; kalau tidak ada, diperlakukan sbg teks
    }
    if (item?.opd_nama) return bidangDari(item.opd_nama) ?? '';
    return '';
  });
  const [bidangBaru, setBidangBaru] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  // Form dianggap kotor bila ada isian yang berubah dari nilai awal
  const isDirty =
    name !== (item?.name ?? '') ||
    username !== (item?.username ?? '') ||
    email !== (item?.email ?? '') ||
    password !== '' ||
    jabatan !== (item?.jabatan ?? '') ||
    role !== (item?.role ?? 'admin_opd') ||
    opdId !== (item?.opd_id ? String(item.opd_id) : '') ||
    bidangBaru !== '';

  // Tutup modal: form kotor → minta konfirmasi dulu
  const requestClose = () => {
    if (saving) return;
    if (isDirty) setConfirmClose(true);
    else onClose();
  };

  const inputClass =
    'rounded-lg border px-4 py-3 text-sm w-full outline-none transition-shadow focus:ring-2 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed';
  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
  };

  // Opsi OPD diurutkan alfabetis, label nama lengkap
  const opdSorted = useMemo(
    () => [...opdOptions].sort((a, b) => a.nama_opd.localeCompare(b.nama_opd, 'id')),
    [opdOptions],
  );
  // OPD terpilih & dinas induknya (untuk mengelompokkan opsi bidang)
  const opdTerpilih = useMemo(
    () => opdOptions.find(o => String(o.id) === opdId) ?? null,
    [opdOptions, opdId],
  );
  const dinasInduk = opdTerpilih ? indukDari(opdTerpilih.nama_opd) : '';
  const entriInduk = useMemo(
    () => opdOptions.filter(o => indukDari(o.nama_opd) === dinasInduk),
    [opdOptions, dinasInduk],
  );

  // Opsi bidang yang sudah ada untuk dinas ini
  const bidangOptions = useMemo(
    () =>
      entriInduk
        .map(o => bidangDari(o.nama_opd))
        .filter((b): b is string => b !== null)
        .filter((b, i, arr) => arr.indexOf(b) === i),
    [entriInduk],
  );

  // Bila bidang tersimpan tidak ada di opsi (bidang baru custom), tampilkan sebagai input teks
  const bidangDikenal = bidangChoice === '' || bidangChoice === BIDANG_BARU || bidangOptions.includes(bidangChoice);
  const bidangAktif = bidangDikenal ? bidangChoice : BIDANG_BARU;
  const bidangCustom = bidangDikenal ? bidangBaru : (bidangBaru || bidangChoice);

  const bidangFinal =
    bidangAktif === BIDANG_BARU ? bidangCustom.trim() || null
    : bidangAktif !== '' ? bidangAktif
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: UserPayload = {
      name,
      username: username.trim().toLowerCase(),
      email,
      role,
      jabatan: jabatan || null,
      opd_id: role === 'admin_opd' ? (opdId ? Number(opdId) : null) : null,
      bidang: role === 'admin_opd' ? bidangFinal : null,
    };
    if (password) payload.password = password;

    try {
      if (isEdit) {
        await updateUser(item!.id, payload);
      } else {
        await createUser(payload);
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
      onClick={requestClose}
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
              {isEdit ? 'Edit User' : 'Tambah User'}
            </h2>
            {isEdit && (
              <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {item!.email}
              </p>
            )}
          </div>
          <button
            onClick={requestClose}
            className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-8 py-7 flex flex-col gap-7">
          <Field label="Nama">
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} style={inputStyle} />
          </Field>

          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={60}
              pattern="[a-z0-9_.\-]+"
              title="Huruf kecil, angka, titik, strip, atau garis bawah — tanpa spasi"
              placeholder="Mis. dinaspu"
              autoComplete="off"
              className={inputClass}
              style={inputStyle}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Dipakai untuk login. Huruf kecil, tanpa spasi (a-z 0-9 . _ -)
            </p>
          </Field>

          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} style={inputStyle} />
          </Field>

          <Field label="Jabatan (opsional)">
            <input
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Mis. Kepala Bidang P2P"
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <Field label={isEdit ? 'Password baru (kosongkan jika tidak diganti)' : 'Password'}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              minLength={6}
              placeholder={isEdit ? '••••••' : 'Minimal 6 karakter'}
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'super_admin' | 'admin_opd' | 'admin_analis')}
                disabled={isSelf}
                className={inputClass}
                style={inputStyle}
              >
                <option value="admin_opd">Admin OPD</option>
                <option value="admin_analis">Admin Analis</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Field>
            {role === 'admin_opd' && (
              <Field label="OPD / Dinas">
                <OpdSearchSelect
                  options={opdSorted}
                  value={opdId}
                  onChange={(v) => {
                    setOpdId(v);
                    setBidangChoice('');
                    setBidangBaru('');
                  }}
                  placeholder="— Pilih dinas —"
                  required
                />
              </Field>
            )}
          </div>

          {role === 'admin_opd' && opdId && (
            <Field label="Bidang (opsional)">
              <select
                value={bidangAktif}
                onChange={(e) => {
                  setBidangChoice(e.target.value);
                  if (e.target.value !== BIDANG_BARU) setBidangBaru('');
                }}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">— Tanpa bidang (induk) —</option>
                {bidangOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value={BIDANG_BARU}>+ Bidang baru…</option>
              </select>
              {bidangAktif === BIDANG_BARU && (
                <input
                  value={bidangCustom}
                  onChange={(e) => setBidangBaru(e.target.value)}
                  placeholder="Mis. Bidang HI"
                  className={inputClass}
                  style={{ ...inputStyle, marginTop: '0.5rem' }}
                />
              )}
            </Field>
          )}

          {error && (
            <p className="text-sm rounded-lg px-4 py-3.5 leading-relaxed" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-3 pb-1">
            <button
              type="button"
              onClick={requestClose}
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

      {confirmClose && (
        <ConfirmCloseModal
          onLanjutkan={() => setConfirmClose(false)}
          onKeluar={onClose}
        />
      )}
    </div>
  );
}

// ── Modal konfirmasi hapus ─────────────────────────
function DeleteConfirmModal({
  item, onClose, onDeleted,
}: {
  item: AdminUserRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(item.id);
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
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Hapus user?</h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{item.name}</strong> ({item.email}) akan dihapus
            permanen dan tidak bisa login lagi.
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
