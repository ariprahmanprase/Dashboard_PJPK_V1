import type { PerOpdItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';

interface Props {
  data: PerOpdItem[];
  loading: boolean;
}

export default function BarPerOpd({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border flex items-center justify-center py-16"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <BarChart3 size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada data per OPD</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1rem 0.75rem 0 0' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
        Status per OPD
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
          <YAxis dataKey="opd" type="category" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} width={80} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text)' }} />
          <Legend wrapperStyle={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }} />
          <Bar dataKey="on_track" name="On Track" stackId="a" fill="#22c55e" />
          <Bar dataKey="warning" name="Warning" stackId="a" fill="#f59e0b" />
          <Bar dataKey="alert" name="Alert" stackId="a" fill="#ef4444" />
          <Bar dataKey="belum_diisi" name="Belum Diisi" stackId="a" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
