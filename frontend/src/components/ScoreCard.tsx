import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number | string;
  description?: string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  active?: boolean;
  onClick?: () => void;
}

const colors: Record<string, { bg: string; accent: string; text: string; border: string }> = {
  info: { bg: 'hsl(var(--ds-secondary) / 0.10)', accent: '#00aeef', text: '#00aeef', border: 'hsl(var(--ds-secondary) / 0.35)' },
  success: { bg: 'hsl(var(--ds-primary) / 0.10)', accent: '#00a651', text: '#00a651', border: 'hsl(var(--ds-primary) / 0.35)' },
  warning: { bg: 'hsl(var(--ds-warning) / 0.12)', accent: '#e6c800', text: '#e6c800', border: 'hsl(var(--ds-warning) / 0.40)' },
  danger: { bg: 'hsl(var(--ds-danger) / 0.10)', accent: '#ef4444', text: '#ef4444', border: 'hsl(var(--ds-danger) / 0.35)' },
  default: { bg: 'hsl(var(--ds-card))', accent: 'hsl(var(--ds-muted-foreground))', text: 'hsl(var(--ds-foreground))', border: 'hsl(var(--ds-border))' },
};

const ACTIVE_COLOR = '#00aeef';

export default function ScoreCard({ label, value, description, variant, active, onClick }: Props) {
  const c = colors[variant];

  return (
    <button
      onClick={onClick}
      className="rounded-xl border overflow-hidden text-left w-full transition-all duration-150 hover:shadow-md"
      style={{
        backgroundColor: c.bg,
        borderColor: active ? ACTIVE_COLOR : c.border,
        padding: '1.25rem',
        position: 'relative',
        cursor: 'pointer',
        outline: active ? `2px solid ${ACTIVE_COLOR}` : 'none',
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
        style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.5rem' }}
      >
        {label}
      </p>
      <p className="text-[30px] font-bold tracking-tight leading-none" style={{ color: c.text }}>
        {value}
      </p>
      {description && (
        <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.8 }}>
          {description}
        </p>
      )}
    </button>
  );
}
