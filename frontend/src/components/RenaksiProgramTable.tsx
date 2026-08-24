import { useState } from 'react';
import { Loader2, FileX, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react';
import type { RenaksiProgramRow } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';
import RenaksiProgramModal from './RenaksiProgramModal';

interface Props {
  data: RenaksiProgramRow[];
  loading: boolean;
  onRowClick?: (row: RenaksiProgramRow) => void;
  /** Mode admin: tambahkan kolom Aksi (Edit/Hapus) di ujung kanan */
  actions?: {
    onEdit: (row: RenaksiProgramRow) => void;
    onDelete?: (row: RenaksiProgramRow) => void;
  };
}

export default function RenaksiProgramTable({ data, loading, onRowClick, actions }: Props) {
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
          <table className="w-full text-sm" style={{ minWidth: actions ? 1250 : 1100 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['No', 'Dinas', 'Program', 'Rencana Aksi', 'Tahun', 'Target', 'Realisasi', 'Indikator', 'Pilar Terkait', 'Status', ...(actions ? ['Aksi'] : [])].map(h => (
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
                  key={`${row.no}-${row.rencana_aksi.slice(0, 24)}`}
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
                    className="align-middle"
                    style={{ color: 'var(--color-text)', fontSize: '0.8125rem', padding: '0.75rem 1.25rem', maxWidth: 200 }}
                  >
                    <span className="line-clamp-2">{row.program}</span>
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
                  <td className="align-middle" style={{ padding: '0.75rem 1.25rem', maxWidth: 160 }}>
                    {row.pilar && row.pilar.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.pilar.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                    <span
                      className="inline-flex items-center font-medium rounded-lg"
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        backgroundColor: renaksiStatusStyle(row.status).bg,
                        color: renaksiStatusStyle(row.status).color,
                      }}
                    >
                      {row.status === 'Tidak Tercapai' ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                      <span className="ml-1">{renaksiStatusStyle(row.status).label}</span>
                    </span>
                  </td>
                  {actions && (
                    <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); actions.onEdit(row); }}
                          className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 0.875rem' }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        {actions.onDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); actions.onDelete!(row); }}
                            className="flex items-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                            style={{ borderColor: '#fca5a5', color: '#dc2626', padding: '0.5rem 0.875rem' }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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
