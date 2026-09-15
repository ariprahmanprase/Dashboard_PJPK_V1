import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import type { RenaksiProgramRow } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';

interface Props {
  open: boolean;
  onClose: () => void;
  data: RenaksiProgramRow | null;
  /** Konten tambahan di bagian bawah modal (mis. seksi AI di area admin) */
  extra?: React.ReactNode;
  /** z-index overlay (default 50) — naikkan bila modal dibuka di atas modal lain */
  zIndex?: number;
}

export default function RenaksiProgramModal({ open, onClose, data, extra, zIndex = 50 }: Props) {
  if (!open || !data) return null;

  const st = renaksiStatusStyle(data.status);
  const tercapai = data.status === 'Tercapai' || data.status === 'Hampir Tercapai';

  // Portal ke body: animasi reveal memberi transform pada ancestor halaman publik,
  // yang membuat position:fixed menempel ke ancestor (overlay tidak full layar).
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full mx-4 flex flex-col"
        style={{
          backgroundColor: 'hsl(var(--ds-card))',
          border: '1px solid hsl(var(--ds-border))',
          maxWidth: 700,
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
          <div className="flex items-start gap-3" style={{ minWidth: 0 }}>
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: st.bg }}
            >
              {data.status === 'Belum diisi' ? (
                <Clock size={20} style={{ color: st.color }} />
              ) : tercapai ? (
                <CheckCircle2 size={20} style={{ color: st.color }} />
              ) : (
                <XCircle size={20} style={{ color: st.color }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'hsl(var(--ds-muted-foreground))', overflowWrap: 'anywhere' }}
              >
                {data.dinas}{data.kode_program ? ` — ${data.kode_program}` : ''}
              </p>
              <h3 className="text-base font-bold mt-0.5" style={{ color: 'hsl(var(--ds-foreground))', overflowWrap: 'anywhere' }}>
                {data.program}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--ds-muted-foreground))', overflowWrap: 'anywhere' }}>
                {data.rencana_aksi}
              </p>
            </div>
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
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '1.5rem' }}>
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Tahun
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--ds-foreground))' }}>
                {data.tahun}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Target
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--ds-foreground))' }}>
                {data.target}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Realisasi
              </p>
              <p className="text-sm" style={{ color: 'hsl(var(--ds-foreground))' }}>
                {data.realisasi}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Status
              </p>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: st.bg, color: st.color }}
              >
                {data.status === 'Belum diisi' ? (
                  <Clock size={14} />
                ) : tercapai ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                {st.label}
              </span>
            </div>
          </div>

          {/* Additional Info — susun vertikal ke bawah */}
          <div
            className="flex flex-col gap-6 pt-8 mt-2"
            style={{ borderTop: '1px solid hsl(var(--ds-border))' }}
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Kendala
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: 'hsl(var(--ds-foreground))' }}
              >
                {data.kendala || '-'}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Catatan
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: 'hsl(var(--ds-foreground))' }}
              >
                {data.catatan || '-'}
              </p>
            </div>
            {data.dokumentasi && (
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'hsl(var(--ds-muted-foreground))' }}
                >
                  Dokumentasi
                </p>
                <a
                  href={data.dokumentasi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-2 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(0, 174, 239, 0.1)',
                    color: '#00aeef',
                    wordBreak: 'break-all',
                  }}
                >
                  <ExternalLink size={14} className="shrink-0" />
                  {data.dokumentasi}
                </a>
              </div>
            )}
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Indikator Terkait
              </p>
              {data.indikator && data.indikator.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.indikator.map((ind, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(0, 174, 239, 0.12)', color: '#00aeef' }}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                  -
                </p>
              )}
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'hsl(var(--ds-muted-foreground))' }}
              >
                Pilar Terkait
              </p>
              {data.pilar && data.pilar.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.pilar.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                  -
                </p>
              )}
            </div>
          </div>

          {/* Konten tambahan (mis. Analisis & Rekomendasi AI di area admin) */}
          {extra && (
            <div className="pt-8 mt-2" style={{ borderTop: '1px solid hsl(var(--ds-border))' }}>
              {extra}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
