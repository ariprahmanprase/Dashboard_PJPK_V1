import type { ChartIndikatorEntry } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

interface Props {
  data: ChartIndikatorEntry[];
  loading: boolean;
}

export default function SmallMultipleIndikator({ data, loading }: Props) {
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
        <TrendingUp size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada data tren</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1rem' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        Tren per Indikator
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {data.map(item => (
          <div key={item.indikator} style={{ border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.5rem 0.25rem 0.25rem 0' }}>
            <p className="text-xs font-medium text-center" title={item.indikator} style={{ color: 'var(--color-text-secondary)', marginBottom: '0.125rem', fontSize: '0.625rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '1.5rem' }}>
              {item.indikator}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={item.data} margin={{ top: 2, right: 8, left: -5, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} />
                <XAxis dataKey="tahun" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} width={30} tickFormatter={v => v > 999 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '0.375rem', fontSize: '0.625rem', color: 'var(--color-text)', padding: '0.25rem 0.5rem' }} />
                <Line type="monotone" dataKey="avg_target" name="Target" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="avg_capaian" name="Capaian" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
