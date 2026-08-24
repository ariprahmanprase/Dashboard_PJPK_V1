import { useState, useEffect } from 'react';
import { X, Loader2, FileX, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { IndikatorDetail, IndikatorRenaksiProgram } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';

interface Props {
  open: boolean;
  onClose: () => void;
  kode: string;
  tahun: string;
}

function StatusIcon({ status, color }: { status: string; color: string }) {
  if (status === 'Belum diisi') return <Clock size={13} style={{ color }} />;
  if (status === 'Tercapai' || status === 'Hampir Tercapai') return <CheckCircle2 size={13} style={{ color }} />;
  return <XCircle size={13} style={{ color }} />;
}

export default function HeatmapRenaksiModal({ open, onClose, kode, tahun }: Props) {
  const [detail, setDetail] = useState<IndikatorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !kode) return;
    setLoading(true);
    setError(false);
    setDetail(null);
    fetch(`/api/indikator/${kode}/detail`)
      .then(res => {
        if (!res.ok) throw new Error(res.status.toString());
        return res.json();
      })
      .then(setDetail)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open, kode]);

  if (!open) return null;

  const renaksis: IndikatorRenaksiProgram[] = detail?.renaksi_programs ?? [];
  // Prioritaskan tahun yang diklik, sisanya tetap ditampilkan di bawahnya
  const sorted = [...renaksis].sort((a, b) => {
    if (a.tahun === tahun && b.tahun !== tahun) return -1;
    if (a.tahun !== tahun && b.tahun === tahun) return 1;
    return a.tahun.localeCompare(b.tahun);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
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
          style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
              >
                {kode}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Tahun {tahun}
              </span>
              {detail && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {detail.pilar}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {detail?.nama_indikator ?? 'Rencana Aksi'}
            </h3>
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
        <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 90px)', padding: '1rem 1.5rem' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Gagal memuat data</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Belum ada rencana aksi untuk indikator ini
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {sorted.length} rencana aksi
                {sorted.some(r => r.tahun === tahun) ? ` — tahun ${tahun} ditampilkan paling atas` : ''}
              </p>
              {sorted.map(r => {
                const st = renaksiStatusStyle(r.status);
                const isSelectedYear = r.tahun === tahun;
                return (
                  <div
                    key={r.id}
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: `1px solid ${isSelectedYear ? st.color : 'var(--color-border)'}`,
                      borderRadius: '0.5rem',
                      padding: '0.625rem 0.875rem',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)', lineHeight: 1.4 }}>
                          {r.rencana_aksi}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                          {r.dinas} · {r.tahun}
                          {r.target !== '-' ? ` · Target: ${r.target}` : ''}
                          {r.realisasi !== '-' ? ` · Realisasi: ${r.realisasi}` : ''}
                        </p>
                      </div>
                      <span
                        className="shrink-0 inline-flex items-center gap-1 font-medium rounded-lg"
                        style={{
                          padding: '0.2rem 0.625rem',
                          fontSize: '0.6875rem',
                          backgroundColor: st.bg,
                          color: st.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <StatusIcon status={r.status} color={st.color} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
