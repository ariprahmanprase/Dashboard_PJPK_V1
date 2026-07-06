import ScoreCard from './ScoreCard';
import type { Scorecards } from '@/types';

export type ScorecardKey = 'total_indikator' | 'total_opd' | 'on_track' | 'warning' | 'alert' | 'target_belum' | 'capaian_belum';

interface Props {
  data: Scorecards | null;
  loading: boolean;
  activeKey: ScorecardKey | null;
  onCardClick: (key: ScorecardKey) => void;
}

export default function ScoreCardGrid({ data, loading, activeKey, onCardClick }: Props) {
  const cards = data ? [
    { label: 'Total Indikator', value: data.total_indikator, variant: 'info' as const, key: 'total_indikator' as ScorecardKey },
    { label: 'Total OPD', value: data.total_opd, variant: 'info' as const, key: 'total_opd' as ScorecardKey },
    { label: 'On Track', value: data.on_track, variant: 'success' as const, key: 'on_track' as ScorecardKey },
    { label: 'Warning', value: data.warning, variant: 'warning' as const, key: 'warning' as ScorecardKey },
    { label: 'Alert', value: data.alert, variant: 'danger' as const, key: 'alert' as ScorecardKey },
    { label: 'Target Belum Diinput', value: data.target_belum_diinput, variant: 'default' as const, key: 'target_belum' as ScorecardKey },
    { label: 'Capaian Belum Diinput', value: data.capaian_belum_diinput, variant: 'default' as const, key: 'capaian_belum' as ScorecardKey },
  ] : [];

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7" style={{ gap: '0.75rem' }}>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-5 animate-pulse"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-2.5" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-14" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7" style={{ gap: '0.75rem' }}>
      {cards.map(c => (
        <ScoreCard
          key={c.key}
          label={c.label}
          value={c.value}
          variant={c.variant}
          active={activeKey === c.key}
          onClick={() => onCardClick(c.key)}
        />
      ))}
    </div>
  );
}
