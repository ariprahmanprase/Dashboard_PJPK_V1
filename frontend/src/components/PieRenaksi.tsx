import type { RenaksiPieData } from '@/types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, PieChartIcon } from 'lucide-react';

interface Props {
  data: RenaksiPieData | null;
  loading: boolean;
  onSliceClick?: (status: string) => void;
}

export default function PieRenaksi({ data, loading, onSliceClick }: Props) {
  const COLORS = ['#22c55e', '#ef4444', '#94a3b8'];

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

  if (!data || (data.terlaksana === 0 && data.tidak_terlaksana === 0 && data.belum_input === 0)) {
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
          Tidak ada data renaksi
        </p>
      </div>
    );
  }

  const chartData = [
    { name: 'Terlaksana', value: data.terlaksana },
    { name: 'Tidak Terlaksana', value: data.tidak_terlaksana },
    { name: 'Belum Input', value: data.belum_input },
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
        Status Renaksi
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
            formatter={(_value: unknown) => [`${_value ?? 0} Rencana`, '']}
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
