import { RefreshCw } from 'lucide-react';
import type { CSSProperties } from 'react';

export interface CaptchaQuestion {
  a: number;
  b: number;
}

interface Props {
  question: CaptchaQuestion;
  answer: string;
  onAnswer: (v: string) => void;
  onRefresh: () => void;
  /** Gaya kaca terang (dipakai halaman login glassmorphism) */
  glass?: boolean;
}

/** Tampilan captcha aritmetika "Saya bukan robot" (state dikelola parent). */
export default function CaptchaBox({ question, answer, onAnswer, onRefresh, glass = false }: Props) {
  const labelColor = glass ? 'rgba(255,255,255,0.92)' : 'var(--color-text)';
  const boxStyle: CSSProperties = glass
    ? { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)' }
    : { backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' };
  const soalColor = glass ? '#ffffff' : 'var(--color-text)';
  const iconColor = glass ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)';

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-sm font-medium" style={{ color: labelColor }}>
        Verifikasi — Saya bukan robot
      </label>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 rounded-lg px-4 py-3 select-none"
          style={boxStyle}
        >
          <span className="text-sm font-semibold tabular-nums" style={{ color: soalColor }}>
            {question.a} + {question.b} = ?
          </span>
          <button
            type="button"
            onClick={onRefresh}
            title="Ganti soal"
            aria-label="Ganti soal"
            className="p-1 rounded-md transition-colors hover:bg-white/10"
            style={{ color: iconColor }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => onAnswer(e.target.value.replace(/\D/g, ''))}
          placeholder="Jawaban"
          aria-label="Jawaban verifikasi"
          className={`rounded-lg px-4 py-3 text-sm w-28 outline-none transition-shadow ${glass ? 'login-glass-input focus:ring-2 focus:ring-white/40' : 'border focus:ring-2 focus:ring-blue-200'}`}
          style={
            glass
              ? { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff' }
              : { backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }
          }
        />
      </div>
    </div>
  );
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Buat soal captcha baru (a + b). */
export function makeCaptchaQuestion(): CaptchaQuestion {
  return { a: randInt(3, 9), b: randInt(1, 9) };
}
