import type { HeatmapRow } from '@/types';
import { Loader2, Grid3X3 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  data: HeatmapRow[];
  loading: boolean;
}

const TAHUN = ['2025', '2026', '2027', '2028', '2029'];

const statusColor: Record<string, string> = {
  Hijau: '#22c55e',
  Kuning: '#f59e0b',
  Merah: '#ef4444',
  Abu: '#94a3b8',
};

export default function HeatmapGrid({ data, loading }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border flex items-center justify-center" style={{ minHeight: 320, backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border flex flex-col items-center justify-center gap-2" style={{ minHeight: 320, backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <Grid3X3 size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada data heatmap</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1rem', position: 'relative' }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        Heatmap Status
      </p>
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.625rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.25rem 0.375rem', color: 'var(--color-text-secondary)', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap' }}>
                <span style={{ display: 'none' }}>Indikator</span>
              </th>
              {TAHUN.map(thn => (
                <th key={thn} style={{ padding: '0.25rem 0.375rem', color: 'var(--color-text-secondary)', textAlign: 'center', fontWeight: 500, width: '3rem' }}>
                  {thn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.kode}>
                <td style={{ padding: '0.25rem 0.375rem', maxWidth: '140px' }}>
                  <span title={`${row.kode}: ${row.nama_indikator}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.5625rem', marginRight: '0.25rem' }}>{row.kode}</span>
                    {row.nama_indikator}
                  </span>
                </td>
                {TAHUN.map(thn => {
                  const warna = (row as unknown as Record<string, string>)[`warna_${thn}`] || 'Abu';
                  const status = (row as unknown as Record<string, string>)[`status_${thn}`] || '-';
                  return (
                    <td key={thn} style={{ padding: '1px', textAlign: 'center' }}>
                      <div
                        title={`${row.kode} — ${thn}: ${status}`}
                        onMouseEnter={e => {
                          setTooltip({ x: e.clientX, y: e.clientY, text: `${row.kode} — ${thn}: ${status}` });
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)';
                          (e.currentTarget as HTMLElement).style.zIndex = '10';
                          (e.currentTarget as HTMLElement).style.position = 'relative';
                        }}
                        onMouseLeave={e => {
                          setTooltip(null);
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                          (e.currentTarget as HTMLElement).style.zIndex = '';
                          (e.currentTarget as HTMLElement).style.position = '';
                        }}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '0.25rem',
                          backgroundColor: statusColor[warna] || '#94a3b8',
                          opacity: status === 'Belum Diisi' ? 0.25 : 0.85,
                          cursor: 'pointer',
                          transition: 'transform 0.15s',
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'On Track', color: '#22c55e' },
          { label: 'Warning', color: '#f59e0b' },
          { label: 'Alert', color: '#ef4444' },
          { label: 'Belum Diisi', color: '#94a3b8', light: true },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '0.125rem', backgroundColor: item.color, opacity: item.light ? 0.25 : 0.85 }} />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.5625rem' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.5rem',
            fontSize: '0.6875rem',
            color: 'var(--color-text)',
            zIndex: 60,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
