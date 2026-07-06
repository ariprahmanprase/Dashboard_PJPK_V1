import type { ChartDataPoint } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';

interface Props {
  data: ChartDataPoint[];
  loading: boolean;
}

export default function ChartCombo({ data, loading }: Props) {
  if (loading) {
    return (
      <div
        className="rounded-xl border flex items-center justify-center py-16"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border flex flex-col items-center justify-center py-16 gap-3"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <BarChart3 size={36} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Tidak ada data chart untuk filter ini
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        padding: '1.5rem 1.25rem 0.5rem 0.25rem',
      }}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} />
          <XAxis
            dataKey="tahun"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={{ stroke: '#cbd5e1' }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={{ stroke: '#cbd5e1' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickFormatter={v => v.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--color-text)',
            }}
            formatter={(value: number, name: string) => {
              const label = name === 'avg_target' ? 'Target' : 'Capaian';
              return [value != null ? value.toLocaleString() : '-', label];
            }}
            labelFormatter={label => `Tahun ${label}`}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={value => (value === 'avg_target' ? 'Target' : 'Capaian')}
            wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}
          />
          <Line
            type="monotone"
            dataKey="avg_target"
            name="avg_target"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="avg_capaian"
            name="avg_capaian"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
