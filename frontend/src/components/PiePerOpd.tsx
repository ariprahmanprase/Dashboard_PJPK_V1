import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, PieChartIcon } from 'lucide-react';
import type { RenaksiProgramRow } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';

interface Props {
  data: RenaksiProgramRow[];
  loading: boolean;
  /** Klik irisan status pada pie sebuah OPD → (dinas, status) */
  onSliceClick?: (dinas: string, status: string) => void;
}

interface OpdGroup {
  dinas: string;
  total: number;
  tercapai: number;
  hampir: number;
  tidak: number;
  belum: number;
}

const STATUS_ORDER: Array<{ key: keyof Omit<OpdGroup, 'dinas' | 'total'>; label: string }> = [
  { key: 'tercapai', label: 'Tercapai' },
  { key: 'hampir', label: 'Hampir Tercapai' },
  { key: 'tidak', label: 'Tidak Tercapai' },
  { key: 'belum', label: 'Belum diisi' },
];

const COLORS: Record<string, string> = {
  'Tercapai': '#00a651',
  'Hampir Tercapai': '#e6c800',
  'Tidak Tercapai': '#ef4444',
  'Belum diisi': 'hsl(var(--ds-muted-foreground))',
};

/**
 * Grid pie chart — satu pie per OPD, menampilkan komposisi status rencana
 * aksinya (Tercapai / Hampir / Tidak / Belum diisi). Mengikuti filter aktif.
 * Klik irisan status → daftar rencana aksi OPD itu difilter status tersebut.
 */
export default function PiePerOpd({ data, loading, onSliceClick }: Props) {
  const groups = useMemo<OpdGroup[]>(() => {
    const map = new Map<string, OpdGroup>();
    for (const r of data) {
      const dinas = r.dinas || '—';
      if (!map.has(dinas)) {
        map.set(dinas, { dinas, total: 0, tercapai: 0, hampir: 0, tidak: 0, belum: 0 });
      }
      const g = map.get(dinas)!;
      g.total++;
      const label = renaksiStatusStyle(r.status).label;
      if (label === 'Tercapai') g.tercapai++;
      else if (label === 'Hampir Tercapai') g.hampir++;
      else if (label === 'Tidak Tercapai') g.tidak++;
      else g.belum++;
    }
    // Urutkan: OPD dengan program terbanyak di atas, lalu alfabetis
    return [...map.values()].sort((a, b) => b.total - a.total || a.dinas.localeCompare(b.dinas, 'id'));
  }, [data]);

  if (loading) {
    return (
      <div className="ds-card flex flex-col items-center justify-center" style={{ padding: '2rem', minHeight: 280 }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="ds-card flex flex-col items-center justify-center gap-2" style={{ padding: '2rem', minHeight: 280 }}>
        <PieChartIcon size={28} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
          Tidak ada data renaksi per OPD
        </p>
      </div>
    );
  }

  return (
    <div className="ds-card" style={{ padding: '1.25rem' }}>
      <p className="ds-section-label" style={{ marginBottom: '0.25rem' }}>
        Rencana Aksi per OPD
      </p>
      <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '1rem' }}>
        Komposisi status tiap OPD — klik irisan untuk melihat daftar rencana aksinya
      </p>

      {/* Legend bersama */}
      <div className="flex flex-wrap" style={{ gap: '0.875rem', marginBottom: '1.25rem' }}>
        {STATUS_ORDER.map(s => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS[s.label], display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {groups.map(g => {
          const chartData = STATUS_ORDER
            .map(s => ({ name: s.label, value: g[s.key] }))
            .filter(d => d.value > 0);

          return (
            <div
              key={g.dinas}
              className="rounded-xl border"
              style={{
                borderColor: 'hsl(var(--ds-border))',
                backgroundColor: 'hsl(var(--ds-background))',
                padding: '0.75rem 0.5rem 0.25rem',
              }}
            >
              <p
                className="text-xs font-semibold text-center"
                title={g.dinas}
                style={{
                  color: 'hsl(var(--ds-foreground))',
                  marginBottom: '0.125rem',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  minHeight: '2em',
                }}
              >
                {g.dinas}
              </p>
              <p className="text-center" style={{ fontSize: '0.6875rem', color: 'hsl(var(--ds-muted-foreground))' }}>
                {g.total} program
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => {
                      if (entry?.name) onSliceClick?.(g.dinas, entry.name);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--ds-card))',
                      border: '1px solid hsl(var(--ds-border))',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'hsl(var(--ds-foreground))',
                    }}
                    formatter={(value: unknown, name: unknown) => [`${value ?? 0} program`, String(name)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
