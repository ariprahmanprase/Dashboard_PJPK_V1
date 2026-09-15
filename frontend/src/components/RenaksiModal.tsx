import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, FileX } from 'lucide-react';
import type { RenaksiItem, RenaksiProgramRow } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';
import RenaksiProgramModal from './RenaksiProgramModal';

interface Props {
  open: boolean;
  onClose: () => void;
  kode: string;
  namaIndikator: string;
  data: RenaksiItem[];
  loading: boolean;
  mode?: 'indikator' | 'all';
}

/** Bentuk baris popup (endpoint renaksi-program-list) — RenaksiItem + field detail */
type PopupRow = RenaksiItem & Partial<RenaksiProgramRow>;

export default function RenaksiModal({ open, onClose, kode, namaIndikator, data, loading, mode = 'indikator' }: Props) {
  // Baris yang diklik → buka popup detail (sama seperti detail di heatmap)
  const [selectedRow, setSelectedRow] = useState<RenaksiProgramRow | null>(null);

  if (!open) return null;

  const isAll = mode === 'all';

  // Portal ke body: animasi reveal memberi transform pada ancestor halaman publik,
  // yang membuat position:fixed menempel ke ancestor (overlay tidak full layar).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col"
        style={{
          backgroundColor: 'hsl(var(--ds-card))',
          border: '1px solid hsl(var(--ds-border))',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--ds-border))',
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3
              className="text-lg font-bold"
              style={{ color: 'hsl(var(--ds-foreground))' }}
            >
              Rencana Aksi
            </h3>
            {isAll ? (
              <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--ds-muted-foreground))', overflowWrap: 'anywhere' }}>
                {kode}
              </p>
            ) : (
              <p
                className="text-sm mt-0.5"
                style={{ color: 'hsl(var(--ds-muted-foreground))', overflowWrap: 'anywhere' }}
              >
                <span
                  className="font-mono font-medium"
                  style={{
                    backgroundColor: 'rgba(0, 174, 239, 0.13)',
                    color: '#00aeef',
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
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            style={{ color: 'hsl(var(--ds-muted-foreground))' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={28} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                Belum ada rencana aksi
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--ds-border))' }}>
                  {(isAll
                    ? ['No', 'Indikator', 'Rencana Aksi', 'OPD', 'Tahun', 'Status', 'Catatan']
                    : ['No', 'Rencana Aksi', 'OPD', 'Tahun', 'Status', 'Catatan']
                  ).map(h => (
                    <th
                      key={h}
                      className="text-left font-medium uppercase tracking-wider"
                      style={{
                        color: 'hsl(var(--ds-muted-foreground))',
                        fontSize: '0.688rem',
                        padding: '0.75rem 1.25rem',
                        backgroundColor: 'hsl(var(--ds-card))',
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
                    title="Klik untuk lihat detail"
                    onClick={() => {
                      const p = item as PopupRow;
                      setSelectedRow({
                        no: p.no,
                        tahun: p.tahun,
                        dinas: p.opd ?? '-',
                        kode_program: p.kode_program ?? '-',
                        program: p.program ?? '-',
                        rencana_aksi: p.rencana_aksi,
                        jenis_target: p.jenis_target ?? 'kualitatif',
                        target: p.target ?? '-',
                        realisasi: p.realisasi ?? '-',
                        kendala: p.kendala ?? null,
                        catatan: p.catatan ?? null,
                        dokumentasi: p.dokumentasi ?? null,
                        indikator: Array.isArray(p.indikator) ? p.indikator : (p.indikator ? [String(p.indikator)] : []),
                        pilar: p.pilar ?? [],
                        status: p.status,
                      });
                    }}
                    style={{ borderBottom: '1px solid hsl(var(--ds-border))', cursor: 'pointer' }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td
                      className="align-middle"
                      style={{
                        color: 'hsl(var(--ds-muted-foreground))',
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
                          color: 'hsl(var(--ds-muted-foreground))',
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
                        color: 'hsl(var(--ds-foreground))',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.rencana_aksi}
                    </td>
                    <td
                      className="align-middle"
                      style={{
                        color: 'hsl(var(--ds-muted-foreground))',
                        fontSize: '0.8125rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.opd || '-'}
                    </td>
                    <td
                      className="align-middle font-mono"
                      style={{
                        color: 'hsl(var(--ds-muted-foreground))',
                        fontSize: '0.75rem',
                        padding: '0.75rem 1.25rem',
                      }}
                    >
                      {item.tahun}
                    </td>
                    <td className="align-middle" style={{ padding: '0.75rem 1.25rem' }}>
                      <span
                        className="inline-block font-medium rounded-lg"
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          backgroundColor: renaksiStatusStyle(item.status).bg,
                          color: renaksiStatusStyle(item.status).color,
                        }}
                      >
                        {renaksiStatusStyle(item.status).label}
                      </span>
                    </td>
                    <td
                      className="align-middle"
                      style={{
                        color: 'hsl(var(--ds-muted-foreground))',
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

      {/* Popup detail renaksi di atas popup ini (sama seperti di heatmap) */}
      <RenaksiProgramModal
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        data={selectedRow}
        zIndex={70}
      />
    </div>,
    document.body,
  );
}
