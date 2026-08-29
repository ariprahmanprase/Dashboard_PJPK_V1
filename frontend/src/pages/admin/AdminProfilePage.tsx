import { useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, UserRound } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import { updateProfile, type AdminUser, type ProfilePayload } from '@/services/admin';

interface Props {
  user: AdminUser;
  onLogout: () => void;
  onNavigate: (page: AdminPageName) => void;
  onUserUpdated: (user: AdminUser) => void;
}

const inputClass =
  'rounded-lg border px-4 py-3 text-sm w-full outline-none transition-shadow focus:ring-2 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed';
const inputStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  super_admin: 'Super Admin',
  admin_opd: 'Admin OPD',
  admin_analis: 'Admin Analis',
};

export default function AdminProfilePage({ user, onLogout, onNavigate, onUserUpdated }: Props) {
  const [name, setName] = useState(user.name);
  const [jabatan, setJabatan] = useState(user.jabatan ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak sama.');
      return;
    }

    setSaving(true);
    const payload: ProfilePayload = { name, jabatan: jabatan || null };
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    try {
      const updated = await updateProfile(payload);
      onUserUpdated(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Profil berhasil diperbarui.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      user={user}
      activePage="profile"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Profil Saya"
      subtitle="Kelola biodata dan password akun Anda"
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl flex flex-col gap-6">
        {/* Info akun (read-only) */}
        <div
          className="rounded-xl border p-5 sm:p-6 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <UserRound size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Informasi Akun</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoItem label="Email" value={user.email} />
            <InfoItem label="Role" value={ROLE_LABEL[user.role]} />
            <InfoItem label="OPD / Dinas" value={user.opd_nama ?? '—'} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Email, role, dan OPD hanya bisa diubah oleh Super Admin melalui menu Kelola User.
          </p>
        </div>

        {/* Biodata */}
        <div
          className="rounded-xl border p-5 sm:p-6 flex flex-col gap-5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Biodata</h2>
          <Field label="Nama Lengkap (dengan gelar)">
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} style={inputStyle} />
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
        </div>

        {/* Ganti password */}
        <div
          className="rounded-xl border p-5 sm:p-6 flex flex-col gap-5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <Lock size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Ganti Password</h2>
          </div>
          <p className="text-xs -mt-3" style={{ color: 'var(--color-text-secondary)' }}>
            Kosongkan semua kolom di bawah jika tidak ingin mengganti password.
          </p>
          <Field label="Password Saat Ini">
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              required={!!newPassword}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Password Baru">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                minLength={6}
                placeholder="Minimal 6 karakter"
              />
            </Field>
            <Field label="Konfirmasi Password Baru">
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                minLength={6}
              />
            </Field>
          </div>
        </div>

        {error && (
          <p className="text-sm rounded-lg px-4 py-3.5 leading-relaxed" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
            {error}
          </p>
        )}
        {success && (
          <p
            className="text-sm rounded-lg px-4 py-3.5 flex items-center gap-2"
            style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}
          >
            <CheckCircle2 size={16} /> {success}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {saving && <Loader2 className="animate-spin" size={14} />}
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

function PasswordInput({
  value,
  onChange,
  required,
  minLength,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className={inputClass}
        style={{ ...inputStyle, paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        style={{ color: 'var(--color-text-secondary)' }}
        title={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{value}</span>
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
