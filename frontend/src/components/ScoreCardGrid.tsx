import ScoreCard from './ScoreCard';
import type { Scorecards } from '@/types';

export type ScorecardKey = 'total_indikator' | 'total_opd' | 'on_track' | 'warning' | 'alert' | 'capaian_belum';

interface Props {
  data: Scorecards | null;
  loading: boolean;
  activeKey: ScorecardKey | null;
  onCardClick: (key: ScorecardKey) => void;
  customLabels?: Record<string, string>;
  customDescriptions?: Record<string, string>;
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

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  total_opd: 'Jumlah OPD pengampu indikator (mengikuti filter)',
  total_indikator: 'Jumlah indikator yang terpantau (mengikuti filter)',
  on_track: 'Indikator dengan capaian sesuai/melampaui target',
  warning: 'Indikator dengan capaian mendekati target',
  alert: 'Indikator dengan capaian jauh di bawah target',
  capaian_belum: 'Indikator yang belum menginput realisasi',
};

export default function ScoreCardGrid({ data, loading, activeKey, onCardClick, customLabels = {}, customDescriptions = {}, hiddenKeys = [] }: Props) {
  const labels = { ...DEFAULT_LABELS, ...customLabels };
  const descriptions = { ...DEFAULT_DESCRIPTIONS, ...customDescriptions };

  const allCards: Array<{key: ScorecardKey; label: string; value: number; description: string; variant: 'info' | 'success' | 'warning' | 'danger' | 'default'}> = data ? [
    { key: 'total_opd', label: labels.total_opd || 'Total OPD', value: data.total_opd, description: descriptions.total_opd, variant: 'info' },
    { key: 'total_indikator', label: labels.total_indikator || 'Total', value: data.total_indikator, description: descriptions.total_indikator, variant: 'info' },
    { key: 'on_track', label: labels.on_track || 'On Track', value: data.on_track, description: descriptions.on_track, variant: 'success' },
    { key: 'warning', label: labels.warning || 'Warning', value: data.warning, description: descriptions.warning, variant: 'warning' },
    { key: 'alert', label: labels.alert || 'Alert', value: data.alert, description: descriptions.alert, variant: 'danger' },
    { key: 'capaian_belum', label: labels.capaian_belum || 'Belum Diinput', value: data.capaian_belum_diinput, description: descriptions.capaian_belum, variant: 'default' },
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
          description={c.description}
          variant={c.variant}
          active={activeKey === c.key}
          onClick={() => onCardClick(c.key)}
        />
      ))}
    </div>
  );
}
