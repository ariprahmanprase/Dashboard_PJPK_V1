import type { RenaksiProgramSummary } from '@/types';

interface Props {
  data: RenaksiProgramSummary | null;
  loading?: boolean;
  onSegmentClick?: (status: string) => void;
}

const SEGMENTS: Array<{ key: 'tercapai' | 'hampir_tercapai' | 'tidak_tercapai' | 'belum_diisi'; label: string; color: string }> = [
  { key: 'tercapai', label: 'Tercapai', color: '#00a651' },
  { key: 'hampir_tercapai', label: 'Hampir Tercapai', color: '#e6c800' },
  { key: 'tidak_tercapai', label: 'Tidak Tercapai', color: '#ef4444' },
  { key: 'belum_diisi', label: 'Belum diisi', color: 'hsl(var(--ds-muted-foreground))' },
];

export default function RenaksiStatusBar({ data, loading, onSegmentClick }: Props) {
  if (loading || !data) {
    return (
      <div
        className="rounded-xl border animate-pulse"
        style={{ backgroundColor: 'hsl(var(--ds-card))', borderColor: 'hsl(var(--ds-border))', padding: '1.25rem 1.5rem' }}
      >
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-3" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  const total = data.tercapai + data.hampir_tercapai + data.tidak_tercapai + data.belum_diisi;
  const segs = SEGMENTS.map(s => ({
    ...s,
    count: data[s.key],
    pct: total > 0 ? (data[s.key] / total) * 100 : 0,
  }));

  return (
    <div
      className="rounded-xl border"
      style={{ backgroundColor: 'hsl(var(--ds-card))', borderColor: 'hsl(var(--ds-border))', padding: '1.25rem 1.5rem' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.875rem' }}>
        Persentase Status Renaksi
      </p>

      {/* Stacked bar */}
      <div
        className="flex w-full overflow-hidden"
        style={{ height: 28, borderRadius: 8, backgroundColor: 'hsl(var(--ds-card))' }}
        role="img"
        aria-label="Distribusi status renaksi"
      >
        {total === 0 ? (
          <div className="flex items-center justify-center w-full text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
            Tidak ada data
          </div>
        ) : (
          segs.filter(s => s.count > 0).map(s => (
            <div
              key={s.key}
              title={`${s.label}: ${s.count} program (${s.pct.toFixed(1)}%)`}
              onClick={onSegmentClick ? () => onSegmentClick(s.label) : undefined}
              style={{
                width: `${s.pct}%`,
                backgroundColor: s.color,
                cursor: onSegmentClick ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'width 300ms ease',
                minWidth: s.pct > 0 ? 4 : 0,
              }}
            >
              {s.pct >= 6 && (
                <span style={{ color: '#fff', fontSize: '0.688rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {s.pct.toFixed(1)}%
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap" style={{ gap: '1rem', marginTop: '0.875rem' }}>
        {segs.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={onSegmentClick ? () => onSegmentClick(s.label) : undefined}
            className="flex items-center gap-1.5"
            style={{
              cursor: onSegmentClick ? 'pointer' : 'default',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color, display: 'inline-block' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
              {s.label}
            </span>
            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--ds-foreground))' }}>
              {s.pct.toFixed(1)}%
            </span>
            <span className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.7 }}>
              ({s.count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
