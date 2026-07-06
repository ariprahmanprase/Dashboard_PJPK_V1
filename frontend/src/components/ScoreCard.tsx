import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  active?: boolean;
  onClick?: () => void;
}

const colors: Record<string, { bg: string; accent: string; text: string; border: string }> = {
  info: { bg: '#eff6ff', accent: '#3b82f6', text: '#1d4ed8', border: '#bfdbfe' },
  success: { bg: '#f0fdf4', accent: '#22c55e', text: '#15803d', border: '#bbf7d0' },
  warning: { bg: '#fffbeb', accent: '#f59e0b', text: '#b45309', border: '#fde68a' },
  danger: { bg: '#fef2f2', accent: '#ef4444', text: '#b91c1c', border: '#fecaca' },
  default: { bg: 'var(--color-bg-secondary)', accent: '#94a3b8', text: 'var(--color-text)', border: 'var(--color-border)' },
};

export default function ScoreCard({ label, value, variant, active, onClick }: Props) {
  const c = colors[variant];

  return (
    <button
      onClick={onClick}
      className="rounded-xl border overflow-hidden text-left w-full transition-all duration-150 hover:shadow-md"
      style={{
        backgroundColor: c.bg,
        borderColor: active ? '#3b82f6' : c.border,
        padding: '1.25rem',
        position: 'relative',
        cursor: 'pointer',
        outline: active ? '2px solid #3b82f6' : 'none',
        outlineOffset: '2px',
        borderWidth: active ? '2px' : '1px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: c.accent,
          borderRadius: '4px 0 0 4px',
        }}
      />
      <p
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}
      >
        {label}
      </p>
      <p className="text-[30px] font-bold tracking-tight leading-none" style={{ color: c.text }}>
        {value}
      </p>
    </button>
  );
}
