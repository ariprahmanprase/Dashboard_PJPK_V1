import { X, Loader2, FileX } from 'lucide-react';
import type { RenaksiItem } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  kode: string;
  namaIndikator: string;
  data: RenaksiItem[];
  loading: boolean;
  mode?: 'indikator' | 'all';
}

export default function RenaksiModal({ open, onClose, kode, namaIndikator, data, loading, mode = 'indikator' }: Props) {
  if (!open) return null;

  const isAll = mode === 'all';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          maxHeight: '80vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              Rencana Aksi
            </h3>
            {isAll ? (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {kode}
              </p>
            ) : (
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span
                  className="font-mono font-medium"
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#3b82f6',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    marginRight: '0.5rem',
                  }}
                >
                  {kode}
                </span>
                {namaIndikator}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 80px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Belum ada rencana aksi
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {(isAll
                    ? ['No', 'Indikator', 'Rencana Aksi', 'OPD', 'Tahun', 'Status', 'Catatan']
                    : ['No', 'Rencana Aksi', 'OPD', 'Tahun', 'Status', 'Catatan']
                  ).map(h => (
                    <th
                      key={h}
                      className="text-left font-medium uppercase tracking-wider"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.688rem',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr
                    key={item.no}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td
                      className="align-middle"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.75rem',
                        padding: '0.75rem 1.25rem',
                        width: '3rem',
                      }}
                    >
                      {item.no}
                    </td>
                    {isAll && (
                      <td
                        className="align-middle"
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.75rem',
                          padding: '0.75rem 1.25rem',
                        }}
                      >
                        {(item as unknown as Record<string, string>).indikator || '-'}
                      </td>
                    )}
                    <td
                      className="font-medium align-middle"
                      style={{
                        color: 'var(--color-text)',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.rencana_aksi}
                    </td>
                    <td
                      className="align-middle"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.opd || '-'}
                    </td>
                    <td
                      className="align-middle font-mono"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.75rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.tahun}
                    </td>
                    <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                      <span
                        className={`inline-block font-medium rounded-lg ${item.status === 'Tidak Terlaksana' ? 'alert-badge-renaksi' : ''}`}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          backgroundColor:
                            item.status === 'Terlaksana'
                              ? 'rgba(34, 197, 94, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                          color:
                            item.status === 'Terlaksana'
                              ? '#16a34a'
                              : '#dc2626',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td
                      className="align-middle"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
