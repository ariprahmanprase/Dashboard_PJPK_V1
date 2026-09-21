import type { TableRow } from '@/types';
import StatusBadge from './StatusBadge';
import { Loader2, FileX } from 'lucide-react';
import { opdInduk } from '@/lib/opd';

interface Props {
  data: TableRow[];
  loading: boolean;
  onRowClick?: (row: TableRow) => void;
}

export default function DataTable({ data, loading, onRowClick }: Props) {
  if (loading) {
    return (
      <div
        className="rounded-xl border flex items-center justify-center py-20"
        style={{
          backgroundColor: 'hsl(var(--ds-card))',
          borderColor: 'hsl(var(--ds-border))',
        }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
        style={{
          backgroundColor: 'hsl(var(--ds-card))',
          borderColor: 'hsl(var(--ds-border))',
        }}
      >
        <FileX size={40} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
          Tidak ada data yang sesuai dengan filter
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden table-wrap"
      style={{
        backgroundColor: 'hsl(var(--ds-card))',
        borderColor: 'hsl(var(--ds-border))',
      }}
    >
      <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: 1200 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid hsl(var(--ds-border))' }}>
            {['Kode', 'Nama Indikator', 'Pilar', 'OPD', 'Tahun', 'Target', 'Capaian', 'Gap', 'Arah Target', 'Status'].map(h => {
              const isNumeric = ['Target', 'Capaian', 'Gap'].includes(h);
              return (
              <th
                key={h}
                className={`font-medium uppercase tracking-wider ${isNumeric ? 'text-right' : 'text-left'}`}
                style={{
                  color: 'hsl(var(--ds-muted-foreground))',
                  fontSize: '0.688rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {h}
              </th>
            )})}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.kode}-${i}`}
              style={{ borderBottom: '1px solid hsl(var(--ds-border))', cursor: 'pointer' }}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              <td
                className="font-mono align-middle"
                style={{
                  color: 'hsl(var(--ds-muted-foreground))',
                  fontSize: '0.75rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {row.kode}
              </td>
              <td
                className="font-medium align-middle"
                style={{
                  color: 'hsl(var(--ds-foreground))',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.8125rem',
                  maxWidth: '260px',
                  minWidth: '160px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                }}
              >
                {row.nama_indikator}
              </td>
              <td
                className="align-middle"
                style={{
                  color: 'hsl(var(--ds-muted-foreground))',
                  fontSize: '0.75rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {row.nama_pilar}
              </td>
              <td className="align-middle" style={{ color: 'hsl(var(--ds-muted-foreground))', padding: '0.875rem 1.25rem', fontSize: '0.75rem', maxWidth: '220px', wordWrap: 'break-word' }}>
                {opdInduk(row.nama_opd)}
              </td>
              <td
                className="font-mono align-middle"
                style={{
                  color: 'hsl(var(--ds-muted-foreground))',
                  fontSize: '0.75rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {row.tahun ?? '-'}
              </td>
              <td
                className="font-mono align-middle text-right"
                style={{
                  color: 'hsl(var(--ds-foreground))',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.75rem',
                }}
              >
                {row.target != null
                  ? row.arah_target === 'Range' && row.target_max != null
                    ? `${row.target.toLocaleString('id-ID')} – ${row.target_max.toLocaleString('id-ID')}`
                    : row.target.toLocaleString('id-ID')
                  : '-'}
              </td>
              <td
                className="font-mono align-middle text-right"
                style={{
                  color: 'hsl(var(--ds-foreground))',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.75rem',
                }}
              >
                {row.capaian != null ? row.capaian.toLocaleString('id-ID') : '-'}
              </td>
              <td
                className="font-mono align-middle text-right"
                style={{
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.75rem',
                }}
              >
                {row.gap != null ? (
                  <span style={{
                    color:
                      row.status_tl === 'On Track' ? '#00a651' :
                      row.status_tl === 'Warning' ? '#e6c800' :
                      '#ef4444',
                  }}>
                    {row.gap >= 0 ? '+' : ''}{row.gap.toLocaleString('id-ID')}
                  </span>
                ) : '-'}
              </td>
              <td
                className="align-middle"
                style={{
                  color: 'hsl(var(--ds-muted-foreground))',
                  fontSize: '0.75rem',
                  padding: '0.875rem 1.25rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.arah_target ?? '-'}
              </td>
              <td className="align-middle" style={{ padding: '1rem 1.5rem' }}>
                <StatusBadge status={row.status_tl} warna={row.warna_tl} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
