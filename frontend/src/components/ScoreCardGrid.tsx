import ScoreCard from './ScoreCard';
import type { Scorecards } from '@/types';

export type ScorecardKey = 'total_indikator' | 'total_opd' | 'on_track' | 'warning' | 'alert' | 'capaian_belum';

interface Props {
  data: Scorecards | null;
  loading: boolean;
  activeKey: ScorecardKey | null;
  onCardClick: (key: ScorecardKey) => void;
  customLabels?: Record<string, string>;
  hiddenKeys?: string[];
}

const DEFAULT_LABELS: Record<string, string> = {
  total_indikator: 'Total Indikator',
  total_opd: 'Total OPD',
  on_track: 'On Track',
  warning: 'Warning',
  alert: 'Alert',
  capaian_belum: 'Capaian Belum Diinput',
};

export default function ScoreCardGrid({ data, loading, activeKey, onCardClick, customLabels = {}, hiddenKeys = [] }: Props) {
  const labels = { ...DEFAULT_LABELS, ...customLabels };

  const allCards: Array<{key: ScorecardKey; label: string; value: number; variant: 'info' | 'success' | 'warning' | 'danger' | 'default'}> = data ? [
    { key: 'total_indikator', label: labels.total_indikator || 'Total', value: data.total_indikator, variant: 'info' },
    { key: 'total_opd', label: labels.total_opd || 'Total OPD', value: data.total_opd, variant: 'info' },
    { key: 'on_track', label: labels.on_track || 'On Track', value: data.on_track, variant: 'success' },
    { key: 'warning', label: labels.warning || 'Warning', value: data.warning, variant: 'warning' },
    { key: 'alert', label: labels.alert || 'Alert', value: data.alert, variant: 'danger' },
    { key: 'capaian_belum', label: labels.capaian_belum || 'Belum Diinput', value: data.capaian_belum_diinput, variant: 'default' },
  ] : [];

  const visibleCards = allCards.filter(c => !hiddenKeys.includes(c.key));

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6" style={{ gap: '0.75rem' }}>
        {[...Array(6)].map((_, i) => (
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
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6" style={{ gap: '0.75rem' }}>
      {visibleCards.map(c => (
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
