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
      <div className="ds-card flex items-center justify-center py-16">
        <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="ds-card flex flex-col items-center justify-center py-16 gap-2">
        <TrendingUp size={28} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Tidak ada data tren</p>
      </div>
    );
  }

  // Grid adaptif sesuai jumlah data (tanpa scroll)
  const n = data.length;
  let gridCols: string;
  let chartH: number;
  if (n === 1) {
    gridCols = '1fr';
    chartH = 340;
  } else if (n <= 2) {
    gridCols = `repeat(${n}, 1fr)`;
    chartH = 260;
  } else if (n <= 4) {
    gridCols = `repeat(${n}, 1fr)`;
    chartH = 200;
  } else if (n <= 8) {
    gridCols = 'repeat(auto-fill, minmax(300px, 1fr))';
    chartH = 140;
  } else {
    gridCols = 'repeat(auto-fill, minmax(240px, 1fr))';
    chartH = 90;
  }
  const clampTitle = n > 8;
  const tickFont = n <= 4 ? 11 : 8.5;

  return (
    <div className="ds-card" style={{ padding: '1rem' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.5rem' }}>
        Tren per Indikator
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '0.75rem' }}>
        {data.map(item => (
          <div key={item.indikator} style={{ border: '1px solid hsl(var(--ds-border))', borderRadius: '0.5rem', padding: '0.5rem 0.25rem 0.25rem 0' }}>
            <p
              className="text-xs font-medium text-center"
              title={item.indikator}
              style={{
                color: 'hsl(var(--ds-muted-foreground))',
                marginBottom: '0.125rem',
                fontSize: '0.625rem',
                ...(clampTitle
                  ? { overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '1.5rem' }
                  : {}),
              }}
            >
              {item.indikator}
            </p>
            <ResponsiveContainer width="100%" height={chartH}>
              <LineChart data={item.data} margin={{ top: 2, right: 8, left: -5, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-border))" strokeOpacity={0.3} />
                <XAxis dataKey="tahun" tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: tickFont }} axisLine={{ stroke: 'hsl(var(--ds-border))' }} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: tickFont }} axisLine={false} tickLine={false} width={30} tickFormatter={v => v > 999 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--ds-card))', border: '1px solid hsl(var(--ds-border))', borderRadius: '0.375rem', fontSize: '0.625rem', color: 'hsl(var(--ds-foreground))', padding: '0.25rem 0.5rem' }} />
                <Line type="monotone" dataKey="avg_target" name="Target" stroke="#00aeef" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="avg_capaian" name="Capaian" stroke="#00a651" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
