import { useState, useEffect } from 'react';
import { X, Loader2, FileX, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { IndikatorDetail, IndikatorRenaksiProgram, RenaksiProgramRow } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';
import RenaksiProgramModal from './RenaksiProgramModal';

const BAR_SEGMENTS = [
  { key: 'Tercapai', color: '#00a651' },
  { key: 'Hampir Tercapai', color: '#e6c800' },
  { key: 'Tidak Tercapai', color: '#ef4444' },
  { key: 'Belum diisi', color: 'hsl(var(--ds-muted-foreground))' },
] as const;

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
  const [selectedRow, setSelectedRow] = useState<RenaksiProgramRow | null>(null);

  useEffect(() => {
    if (!open || !kode) return;
    setLoading(true);
    setError(false);
    setDetail(null);
    setSelectedRow(null);
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
  // Tampilkan HANYA renaksi tahun yang diklik — tahun tanpa data tidak menampilkan apa-apa
  const sorted = renaksis.filter(r => r.tahun === tahun);

  const total = renaksis.length;
  const barSegs = BAR_SEGMENTS.map(s => {
    const count = renaksis.filter(r => renaksiStatusStyle(r.status).label === s.key).length;
    return { ...s, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
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
          style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--ds-border))', flexShrink: 0 }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(0, 174, 239, 0.13)', color: '#00aeef' }}
              >
                {kode}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'hsl(var(--ds-muted))',
                  color: 'hsl(var(--ds-muted-foreground))',
                  border: '1px solid hsl(var(--ds-border))',
                }}
              >
                Tahun {tahun}
              </span>
              {detail && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'hsl(var(--ds-muted))',
                    color: 'hsl(var(--ds-muted-foreground))',
                    border: '1px solid hsl(var(--ds-border))',
                  }}
                >
                  {detail.pilar}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold mt-1" style={{ color: 'hsl(var(--ds-foreground))', overflowWrap: 'anywhere' }}>
              {detail?.nama_indikator ?? 'Rencana Aksi'}
            </h3>
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
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '1rem 1.5rem' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={28} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Gagal memuat data</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                Belum ada data rencana aksi tahun {tahun} untuk indikator ini
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                {sorted.length} rencana aksi — tahun {tahun}
              </p>

              {/* Stacked bar persentase status */}
              <div
                className="rounded-lg border"
                style={{
                  backgroundColor: 'hsl(var(--ds-card))',
                  borderColor: 'hsl(var(--ds-border))',
                  padding: '0.75rem 0.875rem',
                  marginBottom: '0.375rem',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', marginBottom: '0.625rem' }}>
                  Persentase Status Renaksi
                </p>
                <div
                  className="flex w-full overflow-hidden"
                  style={{ height: 24, borderRadius: 6, backgroundColor: 'hsl(var(--ds-card))' }}
                  role="img"
                  aria-label="Distribusi status renaksi indikator ini"
                >
                  {barSegs.filter(s => s.count > 0).map(s => (
                    <div
                      key={s.key}
                      title={`${s.key}: ${s.count} renaksi (${s.pct.toFixed(1)}%)`}
                      style={{
                        width: `${s.pct}%`,
                        backgroundColor: s.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'width 300ms ease',
                        minWidth: s.pct > 0 ? 4 : 0,
                      }}
                    >
                      {s.pct >= 6 && (
                        <span style={{ color: '#fff', fontSize: '0.688rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {s.pct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap" style={{ gap: '0.75rem', marginTop: '0.625rem' }}>
                  {barSegs.map(s => (
                    <div key={s.key} className="flex items-center gap-1.5">
                      <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color, display: 'inline-block' }} />
                      <span className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>{s.key}</span>
                      <span className="text-xs font-semibold" style={{ color: 'hsl(var(--ds-foreground))' }}>{s.pct.toFixed(1)}%</span>
                      <span className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.7 }}>({s.count})</span>
                    </div>
                  ))}
                </div>
              </div>
              {sorted.map(r => {
                const st = renaksiStatusStyle(r.status);
                const isSelectedYear = r.tahun === tahun;
                return (
                  <div
                    key={r.id}
                    title="Klik untuk lihat detail"
                    onClick={() => setSelectedRow({
                      no: r.no ?? r.id,
                      tahun: r.tahun,
                      dinas: r.dinas,
                      kode_program: '',
                      program: r.program,
                      rencana_aksi: r.rencana_aksi,
                      jenis_target: 'kuantitatif',
                      target: r.target,
                      realisasi: r.realisasi,
                      kendala: r.kendala,
                      catatan: r.catatan,
                      dokumentasi: r.dokumentasi ?? null,
                      indikator: detail ? [`${detail.kode} — ${detail.nama_indikator}`] : [],
                      pilar: detail ? [detail.pilar] : [],
                      status: r.status,
                    })}
                    style={{
                      backgroundColor: 'hsl(var(--ds-muted))',
                      border: `1px solid ${isSelectedYear ? st.color : 'hsl(var(--ds-border))'}`,
                      borderRadius: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--ds-foreground))', lineHeight: 1.4 }}>
                          {r.rencana_aksi}
                        </p>
                        <p className="text-xs" style={{ color: 'hsl(var(--ds-muted-foreground))', marginTop: '0.25rem' }}>
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

      {/* Detail modal di atas popup ini (z-index lebih tinggi) */}
      <RenaksiProgramModal
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        data={selectedRow}
        zIndex={70}
      />
    </div>
  );
}
