import { useState } from 'react';
import { Loader2, FileX, CheckCircle2, XCircle } from 'lucide-react';
import type { RenaksiProgramRow } from '@/types';
import RenaksiProgramModal from './RenaksiProgramModal';

interface Props {
  data: RenaksiProgramRow[];
  loading: boolean;
  onRowClick?: (row: RenaksiProgramRow) => void;
}

export default function RenaksiProgramTable({ data, loading, onRowClick }: Props) {
  const [selectedRow, setSelectedRow] = useState<RenaksiProgramRow | null>(null);

  if (loading) {
    return (
      <div
        className="rounded-xl border flex items-center justify-center py-20"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <FileX size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Tidak ada data yang sesuai dengan filter
        </p>
      </div>
    );
  }

  const handleRowClick = (row: RenaksiProgramRow) => {
    setSelectedRow(row);
    if (onRowClick) onRowClick(row);
  };

  const closeModal = () => setSelectedRow(null);

  return (
    <>
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['No', 'Dinas', 'Kode Program', 'Rencana Aksi', 'Tahun', 'Target', 'Realisasi', 'Indikator', 'Status'].map(h => (
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
              {data.map((row) => (
                <tr
                  key={row.no}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => handleRowClick(row)}
                >
                  <td
                    className="align-middle"
                    style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}
                  >
                    {row.no}
                  </td>
                  <td
                    className="align-middle"
                    style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 120 }}
                  >
                    <span className="line-clamp-2">{row.dinas}</span>
                  </td>
                  <td
                    className="align-middle font-mono"
                    style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem', maxWidth: 100 }}
                  >
                    <span className="line-clamp-2">{row.kode_program}</span>
                  </td>
                  <td
                    className="align-middle font-medium"
                    style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 280 }}
                  >
                    <span className="line-clamp-2">{row.rencana_aksi}</span>
                  </td>
                  <td
                    className="align-middle font-mono"
                    style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}
                  >
                    {row.tahun}
                  </td>
                  <td
                    className="align-middle"
                    style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 150 }}
                  >
                    <span className="line-clamp-2">{row.target}</span>
                  </td>
                  <td
                    className="align-middle"
                    style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 150 }}
                  >
                    <span className="line-clamp-2">{row.realisasi}</span>
                  </td>
                  <td className="align-middle" style={{ padding: '0.75rem 1.25rem', maxWidth: 180 }}>
                    {row.indikator && row.indikator.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.indikator.slice(0, 2).map((ind, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
                          >
                            {ind}
                          </span>
                        ))}
                        {row.indikator.length > 2 && (
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
                          >
                            +{row.indikator.length - 2}
                          </span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                    <span
                      className="inline-block font-medium rounded-lg"
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        backgroundColor:
                          row.status === 'Terlaksana' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: row.status === 'Terlaksana' ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {row.status === 'Terlaksana' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span className="ml-1">{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal */}
      <RenaksiProgramModal
        open={selectedRow !== null}
        onClose={closeModal}
        data={selectedRow}
      />
    </>
  );
}
