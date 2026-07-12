import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, PieChartIcon } from 'lucide-react';

interface Props {
  onTrack: number;
  warning: number;
  alert: number;
  belumDiisi: number;
  loading: boolean;
  onSliceClick?: (status: string) => void;
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8'];

export default function PieStatus({ onTrack, warning, alert, belumDiisi, loading, onSliceClick }: Props) {
  if (loading) {
    return (
      <div
        className="rounded-xl border flex flex-col items-center justify-center"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          padding: '1rem',
          minHeight: '320px',
        }}
      >
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  const total = onTrack + warning + alert + belumDiisi;
  if (total === 0) {
    return (
      <div
        className="rounded-xl border flex flex-col items-center justify-center gap-2"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          padding: '1rem',
          minHeight: '320px',
        }}
      >
        <PieChartIcon size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Tidak ada data status
        </p>
      </div>
    );
  }

  const chartData = [
    { name: 'On Track', value: onTrack },
    { name: 'Warning', value: warning },
    { name: 'Alert', value: alert },
    { name: 'Belum Diisi', value: belumDiisi },
  ];

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        padding: '1rem',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
        Status TL
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => { if (entry?.name) onSliceClick?.(entry.name); }}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--color-text)',
            }}
            formatter={(_value: unknown) => [`${_value ?? 0} indikator`, '']}
          />
          <Legend
            verticalAlign="bottom"
            height={30}
            wrapperStyle={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
