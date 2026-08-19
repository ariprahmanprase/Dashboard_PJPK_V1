import { X, CheckCircle2, XCircle } from 'lucide-react';
import type { RenaksiProgramRow } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  data: RenaksiProgramRow | null;
}

export default function RenaksiProgramModal({ open, onClose, data }: Props) {
  if (!open || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full mx-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          maxWidth: 700,
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
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: data.status === 'Terlaksana'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              }}
            >
              {data.status === 'Terlaksana' ? (
                <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
              ) : (
                <XCircle size={20} style={{ color: '#dc2626' }} />
              )}
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {data.dinas} — {data.kode_program} — Tahun {data.tahun}
              </p>
              <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                {data.rencana_aksi}
              </h3>
            </div>
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
        <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 80px)', padding: '1.5rem' }}>
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Target
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {data.target}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Realisasi
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                {data.realisasi}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Status
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: data.status === 'Terlaksana'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: data.status === 'Terlaksana' ? '#16a34a' : '#dc2626',
              }}
            >
              {data.status === 'Terlaksana' ? (
                <CheckCircle2 size={14} />
              ) : (
                <XCircle size={14} />
              )}
              {data.status}
            </span>
          </div>

          {/* Additional Info */}
          <div
            className="grid grid-cols-3 gap-6 pt-6"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Kendala
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: 'var(--color-text)' }}
              >
                {data.kendala || '-'}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Catatan
              </p>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: 'var(--color-text)' }}
              >
                {data.catatan || '-'}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Indikator Terkait
              </p>
              {data.indikator && data.indikator.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.indikator.map((ind, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  -
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
