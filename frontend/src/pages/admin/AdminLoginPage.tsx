import { useState, type FormEvent } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import CaptchaBox, { makeCaptchaQuestion } from '@/components/admin/CaptchaBox';
import { login } from '@/services/admin';

interface Props {
  onSuccess: () => void;
}

export default function AdminLoginPage({ onSuccess }: Props) {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Captcha "Saya bukan robot"
  const [captcha, setCaptcha] = useState(makeCaptchaQuestion);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const resetCaptcha = () => {
    setCaptcha(makeCaptchaQuestion());
    setCaptchaAnswer('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasi captcha dulu
    if (captchaAnswer.trim() === '') {
      setError('Silakan jawab verifikasi "Saya bukan robot" dulu.');
      return;
    }
    if (Number(captchaAnswer) !== captcha.a + captcha.b) {
      setError('Jawaban verifikasi salah, coba lagi.');
      resetCaptcha();
      return;
    }

    setLoading(true);
    try {
      await login(loginInput.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk, coba lagi.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-5 py-16 sm:px-8">
      {/* Placeholder terang untuk input di panel kaca */}
      <style>{`
        .login-glass input::placeholder,
        .login-glass-input::placeholder { color: rgba(255, 255, 255, 0.55); }
      `}</style>

      {/* Background fullscreen: view Sidoarjo diblur + tint gelap (dasar efek kaca) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/view-sidoarjo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(14px) brightness(0.55) saturate(1.1)',
          transform: 'scale(1.06)', // hindari tepi blur yang pudar
        }}
      />

      {/* Card kaca (glassmorphism): kiri branding, kanan form */}
      <div
        className="login-glass relative w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row"
        style={{
          background: 'rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(18px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* ── Sisi kiri: branding di atas view Sidoarjo + overlay ── */}
        <div
          className="relative flex flex-col justify-center items-center md:items-start gap-5 px-8 py-12 md:px-12 md:w-[46%] overflow-hidden"
          style={{
            backgroundImage: 'url(/view-sidoarjo.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRight: '1px solid rgba(255, 255, 255, 0.14)',
            minHeight: 220,
          }}
        >
          {/* Overlay emerald transparan — foto tetap terlihat, teks tetap terbaca */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(150deg, rgba(6, 78, 52, 0.78) 0%, rgba(4, 45, 32, 0.62) 55%, rgba(6, 78, 52, 0.50) 100%)',
            }}
          />

          <div className="relative flex flex-col items-center md:items-start gap-4">
          <img
            src="/logo-sidoarjo.webp"
            alt="Logo Kabupaten Sidoarjo"
            style={{ width: 76, height: 76, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}
          />
          <h1
            className="text-2xl sm:text-3xl font-bold text-center md:text-left"
            style={{ color: '#ffffff', lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            Dashboard PJPK
          </h1>
          <p
            className="text-sm text-center md:text-left leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}
          >
            Masuk untuk melihat dashboard
            <br />
            Kabupaten Sidoarjo
          </p>
          </div>
        </div>

        {/* ── Sisi kanan: form login (panel kaca) ── */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: '#ffffff', marginBottom: '0.75rem' }}>
              Masuk
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '2.5rem' }}>
              Gunakan username atau email akun Anda
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="login" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Username atau Email
                </label>
                <input
                  id="login"
                  type="text"
                  required
                  autoComplete="username"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Masukkan username atau email"
                  className="rounded-lg px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-white/40"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                  }}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
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
                  className="rounded-lg px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-white/40"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                  }}
                />
              </div>

              <CaptchaBox
                glass
                question={captcha}
                answer={captchaAnswer}
                onAnswer={setCaptchaAnswer}
                onRefresh={resetCaptcha}
              />

              {error && (
                <p
                  className="text-sm rounded-lg px-4 py-3.5 leading-relaxed"
                  style={{ background: 'rgba(220, 38, 38, 0.18)', border: '1px solid rgba(248, 113, 113, 0.4)', color: '#fecaca' }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex items-center justify-center gap-2.5 rounded-lg px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                {loading ? 'Memeriksa…' : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
