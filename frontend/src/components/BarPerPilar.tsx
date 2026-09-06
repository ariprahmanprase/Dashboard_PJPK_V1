import type { PerPilarItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';

interface Props {
  data: PerPilarItem[];
  loading: boolean;
}

export default function BarPerPilar({ data, loading }: Props) {
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
        <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Tidak ada data per pilar</p>
      </div>
    );
  }

  return (
    <div className="ds-card" style={{ padding: '1rem 0.75rem 0 0' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.25rem' }}>
        Status per Pilar
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ds-border))" strokeOpacity={0.5} horizontal={false} />
          <XAxis type="number" tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 11 }} axisLine={{ stroke: 'hsl(var(--ds-border))' }} />
          <YAxis dataKey="pilar" type="category" tick={{ fill: 'hsl(var(--ds-muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--ds-border))' }} width={160} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--ds-card))', border: '1px solid hsl(var(--ds-border))', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--ds-foreground))' }} />
          <Legend wrapperStyle={{ fontSize: '0.6875rem', color: 'hsl(var(--ds-muted-foreground))' }} />
          <Bar dataKey="on_track" name="On Track" stackId="a" fill="#00a651" />
          <Bar dataKey="warning" name="Warning" stackId="a" fill="#e6c800" />
          <Bar dataKey="alert" name="Alert" stackId="a" fill="#ef4444" />
          <Bar dataKey="belum_diisi" name="Belum Diisi" stackId="a" fill="hsl(var(--ds-muted-foreground))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
