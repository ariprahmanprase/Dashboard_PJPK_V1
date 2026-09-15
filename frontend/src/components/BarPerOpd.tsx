import type { PerOpdItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';
import { opdSingkat } from '@/lib/opd';

interface Props {
  data: PerOpdItem[];
  loading: boolean;
}

// Label kustom sumbu Y: singkatan OPD + tooltip native berisi nama lengkap
function OpdTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const nama = payload?.value ?? '';
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{nama}</title>
      <text x={-6} y={0} dy={4} textAnchor="end" fill="hsl(var(--ds-muted-foreground))" fontSize={10}>
        {opdSingkat(nama)}
      </text>
    </g>
  );
}

export default function BarPerOpd({ data, loading }: Props) {
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
        <BarChart3 size={28} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Tidak ada data per OPD</p>
      </div>
    );
  }

  return (
    <div className="ds-card" style={{ padding: '1rem 0.75rem 0 0' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.25rem' }}>
        Status per OPD
      </p>
      {/* Tinggi chart mengikuti jumlah OPD: barCategoryGap memberi jarak antar bar,
          barSize membatasi ketebalan bar agar label mudah dibaca */}
      <ResponsiveContainer width="100%" height={Math.max(280, data.length * 44 + 80)}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barCategoryGap={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-border))" strokeOpacity={0.5} horizontal={false} />
          <XAxis type="number" tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--ds-border))' }} />
          <YAxis dataKey="opd" type="category" tick={<OpdTick />} axisLine={{ stroke: 'hsl(var(--ds-border))' }} width={86} interval={0} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--ds-card))', border: '1px solid hsl(var(--ds-border))', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--ds-foreground))' }} />
          <Legend wrapperStyle={{ fontSize: '0.6875rem', color: 'hsl(var(--ds-muted-foreground))' }} />
          <Bar dataKey="on_track" name="On Track" stackId="a" fill="#00a651" barSize={18} />
          <Bar dataKey="warning" name="Warning" stackId="a" fill="#e6c800" barSize={18} />
          <Bar dataKey="alert" name="Alert" stackId="a" fill="#ef4444" barSize={18} />
          <Bar dataKey="belum_diisi" name="Belum Diisi" stackId="a" fill="hsl(var(--ds-muted-foreground))" barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
