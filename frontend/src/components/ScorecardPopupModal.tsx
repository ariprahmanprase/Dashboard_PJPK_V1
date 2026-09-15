import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import type { RenaksiProgramRow } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';
import RenaksiProgramModal from './RenaksiProgramModal';

interface Props {
  open: boolean;
  title: string;
  rows: RenaksiProgramRow[];
  onClose: () => void;
}

export default function ScorecardPopupModal({ open, title, rows, onClose }: Props) {
  const [selectedRow, setSelectedRow] = useState<RenaksiProgramRow | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setSelectedRow(null);
    onClose();
  };

  // Portal ke body: animasi reveal memberi transform pada ancestor halaman publik,
  // yang membuat position:fixed menempel ke ancestor (overlay tidak full layar).
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={handleClose}
      >
        <div
          className="rounded-2xl shadow-2xl flex flex-col"
          style={{
            backgroundColor: 'hsl(var(--ds-card))',
            border: '1px solid hsl(var(--ds-border))',
            maxWidth: 900,
            width: '92%',
            maxHeight: '80vh',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between gap-3"
            style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--ds-border))', flexShrink: 0 }}
          >
            <div style={{ minWidth: 0 }}>
              <p className="text-base font-bold" style={{ color: 'hsl(var(--ds-foreground))', overflowWrap: 'anywhere' }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                {rows.length} program
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ overflow: 'auto', flex: 1, minHeight: 0, padding: '0.5rem 0' }}>
            {rows.length === 0 ? (
              <p className="text-sm text-center py-12" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                Tidak ada program dengan status ini
              </p>
            ) : (
              <table className="w-full text-sm" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--ds-border))' }}>
                    {['No', 'Dinas', 'Program', 'Rencana Aksi', 'Target', 'Realisasi', 'Status'].map(h => (
                      <th
                        key={h}
                        className="text-left font-medium uppercase tracking-wider"
                        style={{
                          color: 'hsl(var(--ds-muted-foreground))',
                          fontSize: '0.688rem',
                          padding: '0.625rem 1.25rem',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.no}-${idx}`}
                      style={{ borderBottom: '1px solid hsl(var(--ds-border))', cursor: 'pointer' }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setSelectedRow(row)}
                    >
                      <td style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.75rem', padding: '0.625rem 1.25rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ color: 'hsl(var(--ds-foreground))', fontSize: '0.8125rem', padding: '0.625rem 1.25rem', maxWidth: 140 }}>
                        <span className="line-clamp-2">{row.dinas}</span>
                      </td>
                      <td style={{ color: 'hsl(var(--ds-foreground))', fontSize: '0.8125rem', padding: '0.625rem 1.25rem', maxWidth: 200 }}>
                        <span className="line-clamp-2">{row.program}</span>
                      </td>
                      <td className="font-medium" style={{ color: 'hsl(var(--ds-foreground))', fontSize: '0.8125rem', padding: '0.625rem 1.25rem', maxWidth: 240 }}>
                        <span className="line-clamp-2">{row.rencana_aksi}</span>
                      </td>
                      <td style={{ color: 'hsl(var(--ds-foreground))', fontSize: '0.8125rem', padding: '0.625rem 1.25rem', maxWidth: 130 }}>
                        <span className="line-clamp-2">{row.target}</span>
                      </td>
                      <td style={{ color: 'hsl(var(--ds-foreground))', fontSize: '0.8125rem', padding: '0.625rem 1.25rem', maxWidth: 130 }}>
                        <span className="line-clamp-2">{row.realisasi}</span>
                      </td>
                      <td style={{ padding: '0.625rem 1.25rem' }}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal di atas popup (z-index lebih tinggi) */}
      <RenaksiProgramModal
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        data={selectedRow}
        zIndex={70}
      />
    </>,
    document.body,
  );
}
