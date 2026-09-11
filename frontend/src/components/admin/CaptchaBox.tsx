import { RefreshCw } from 'lucide-react';

export interface CaptchaQuestion {
  a: number;
  b: number;
}

interface Props {
  question: CaptchaQuestion;
  answer: string;
  onAnswer: (v: string) => void;
  onRefresh: () => void;
}

/** Tampilan captcha aritmetika "Saya bukan robot" (state dikelola parent). */
export default function CaptchaBox({ question, answer, onAnswer, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        Verifikasi — Saya bukan robot
      </label>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 rounded-lg border px-4 py-3 select-none"
          style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {question.a} + {question.b} = ?
          </span>
          <button
            type="button"
            onClick={onRefresh}
            title="Ganti soal"
            aria-label="Ganti soal"
            className="p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--color-text-secondary)' }}
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
          className="rounded-lg border px-4 py-3 text-sm w-28 outline-none transition-shadow focus:ring-2 focus:ring-blue-200"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
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
