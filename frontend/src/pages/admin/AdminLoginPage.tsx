import { useState, type FormEvent } from 'react';
import { Loader2, Lock, LogIn } from 'lucide-react';
import { login } from '@/services/admin';

interface Props {
  onSuccess: () => void;
}

export default function AdminLoginPage({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-16 sm:px-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl border p-8 sm:p-12 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col items-center gap-4 mb-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              <Lock size={26} />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-center mt-2" style={{ color: 'var(--color-text)' }}>
              Admin Dashboard PJPK
            </h1>
            <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Masuk untuk mengisi &amp; mengelola
              <br />
              realisasi rencana aksi
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@pjpk.sidoarjokab.go.id"
                className="rounded-lg border px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-blue-200"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-blue-200"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            {error && (
              <p
                className="text-sm rounded-lg px-4 py-3.5 leading-relaxed"
                style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex items-center justify-center gap-2.5 rounded-lg px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
              {loading ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm">
          <a href="/" className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
            ← Kembali ke dashboard publik
          </a>
        </p>
      </div>
    </div>
  );
}
