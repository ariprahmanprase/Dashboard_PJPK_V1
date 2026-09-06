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
      <div className="ds-card flex items-center justify-center py-16">
        <Loader2 className="animate-spin" size={28} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="ds-card flex flex-col items-center justify-center py-16 gap-3">
        <BarChart3 size={36} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
          Tidak ada data chart untuk filter ini
        </p>
      </div>
    );
  }

  return (
    <div
      className="ds-card"
      style={{ padding: '1.5rem 1.25rem 0.5rem 0.25rem' }}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="tahun"
            tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--ds-border))' }}
            axisLine={{ stroke: 'hsl(var(--ds-border))' }}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--ds-border))' }}
            axisLine={{ stroke: 'hsl(var(--ds-border))' }}
            tickFormatter={v => v.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--ds-card))',
              border: '1px solid hsl(var(--ds-border))',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              color: 'hsl(var(--ds-foreground))',
            }}
            formatter={(_value: unknown, _name: unknown) => {
              const label = String(_name) === 'avg_target' ? 'Target' : 'Capaian';
              return [_value != null ? Number(_value).toLocaleString() : '-', label];
            }}
            labelFormatter={label => `Tahun ${label}`}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={value => (value === 'avg_target' ? 'Target' : 'Capaian')}
            wrapperStyle={{ fontSize: '0.8125rem', color: 'hsl(var(--ds-foreground))' }}
          />
          <Line
            type="monotone"
            dataKey="avg_target"
            name="avg_target"
            stroke="#00aeef"
            strokeWidth={2.5}
            dot={{ fill: '#00aeef', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#00aeef', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="avg_capaian"
            name="avg_capaian"
            stroke="#00a651"
            strokeWidth={2.5}
            dot={{ fill: '#00a651', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#00a651', strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
