import type { TableRow } from '@/types';
import StatusBadge from './StatusBadge';
import { Loader2, FileX } from 'lucide-react';

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
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <FileX size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Tidak ada data yang sesuai dengan filter
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden table-wrap"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: 700 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Kode', 'Nama Indikator', 'OPD', 'Pilar', 'Status'].map(h => (
              <th
                key={h}
                className="text-left font-medium uppercase tracking-wider"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.688rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.kode}-${i}`}
              style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              <td
                className="font-mono align-middle"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {row.kode}
              </td>
              <td
                className="font-medium align-middle"
                style={{
                  color: 'var(--color-text)',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {row.nama_indikator}
              </td>
              <td className="align-middle" style={{ color: 'var(--color-text-secondary)', padding: '0.875rem 1.25rem' }}>
                {row.nama_opd}
              </td>
              <td
                className="align-middle"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  padding: '0.875rem 1.25rem',
                }}
              >
                {row.nama_pilar}
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
