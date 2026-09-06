import type { TableRow } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlignEndHorizontal } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  data: TableRow[];
  loading: boolean;
}

const statusColor: Record<string, string> = {
  Hijau: '#00a651',
  Kuning: '#e6c800',
  Merah: '#ef4444',
  Abu: 'hsl(var(--ds-muted-foreground))',
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
        style={{ backgroundColor: 'hsl(var(--ds-card))', borderColor: 'hsl(var(--ds-border))' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
      </div>
    );
  }

  if (!ranked.length) {
    return (
      <div className="rounded-xl border flex flex-col items-center justify-center py-16 gap-2"
        style={{ backgroundColor: 'hsl(var(--ds-card))', borderColor: 'hsl(var(--ds-border))' }}>
        <AlignEndHorizontal size={28} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Tidak ada data gap</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'hsl(var(--ds-card))', borderColor: 'hsl(var(--ds-border))', padding: '1rem 0.75rem 0 0' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.5rem' }}>
        Ranking Gap (Terburuk → Terbaik)
      </p>
      <ResponsiveContainer width="100%" height={Math.max(600, ranked.length * 24)}>
        <BarChart data={ranked} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-border))" strokeOpacity={0.7} horizontal={false} />
          <XAxis type="number" tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--ds-border))' }} />
          <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 9 }} axisLine={{ stroke: 'hsl(var(--ds-border))' }} width={220} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--ds-card))', border: '1px solid hsl(var(--ds-border))', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--ds-foreground))' }}
            formatter={(value: unknown) => {
              const n = Number(value);
              return [isNaN(n) ? '-' : n.toFixed(2), 'Gap'];
            }}
            labelFormatter={label => String(label).split(':')[0]}
          />
          <Bar dataKey="gap" name="Gap" radius={[0, 4, 4, 0]}>
            {ranked.map((item, i) => (
              <Cell key={i} fill={statusColor[item.warna] || 'hsl(var(--ds-muted-foreground))'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
