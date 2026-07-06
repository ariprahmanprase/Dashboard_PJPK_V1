import type { TableRow } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlignEndHorizontal } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  data: TableRow[];
  loading: boolean;
}

const statusColor: Record<string, string> = {
  Hijau: '#22c55e',
  Kuning: '#f59e0b',
  Merah: '#ef4444',
  Abu: '#94a3b8',
};

export default function GapRanking({ data, loading }: Props) {
  const ranked = useMemo(() => {
    return [...data]
      .filter(r => r.gap !== null && r.gap !== undefined)
      .sort((a, b) => Number(b.gap ?? 0) - Number(a.gap ?? 0))
      .map(r => ({ name: `${r.kode}: ${r.nama_indikator}`, gap: Number(r.gap), warna: r.warna_tl, kode: r.kode }));
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-xl border flex items-center justify-center py-16"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (!ranked.length) {
    return (
      <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <AlignEndHorizontal size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada data gap</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1rem 0.75rem 0 0' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        Ranking Gap (Terburuk → Terbaik)
      </p>
      <ResponsiveContainer width="100%" height={Math.max(600, ranked.length * 24)}>
        <BarChart data={ranked} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#cbd5e1' }} width={220} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text)' }}
            formatter={(value: unknown) => {
              const n = Number(value);
              return [isNaN(n) ? '-' : n.toFixed(2), 'Gap'];
            }}
            labelFormatter={label => String(label).split(':')[0]}
          />
          <Bar dataKey="gap" name="Gap" radius={[0, 4, 4, 0]}>
            {ranked.map((item, i) => (
              <Cell key={i} fill={statusColor[item.warna] || '#94a3b8'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
