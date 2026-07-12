import { X, Loader2, FileX } from 'lucide-react';
import type { TableRow } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: TableRow[];
  loading: boolean;
}

const COLOR_MAP: Record<string, string> = {
  'On Track': '#22c55e',
  'Warning': '#f59e0b',
  'Alert': '#ef4444',
  'Belum Diisi': '#94a3b8',
};

export default function StatusDetailModal({ open, onClose, title, subtitle, data, loading }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden"
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
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Detail Status: {title}
            </h3>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {subtitle}
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
                Tidak ada data
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['No', 'Kode', 'Indikator', 'Pilar', 'OPD'].map(h => (
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
                {data.map((item, idx) => (
                  <tr
                    key={item.kode}
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
                      {idx + 1}
                    </td>
                    <td
                      className="align-middle font-mono font-medium"
                      style={{
                        color: '#3b82f6',
                        fontSize: '0.75rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.kode}
                    </td>
                    <td
                      className="font-medium align-middle"
                      style={{
                        color: 'var(--color-text)',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.nama_indikator}
                    </td>
                    <td
                      className="align-middle"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.nama_pilar}
                    </td>
                    <td
                      className="align-middle"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.nama_opd}
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
