import { useState, useEffect } from 'react';
import { X, Loader2, FileX, ListChecks } from 'lucide-react';
import type { IndikatorDetail, IndikatorRenaksiProgram } from '@/types';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';

interface Props {
  open: boolean;
  onClose: () => void;
  kode: string;
}

export default function IndikatorDetailModal({ open, onClose, kode }: Props) {
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

  // Helpers
  const labelStyle: React.CSSProperties = {
    color: 'hsl(var(--ds-muted-foreground))',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  };

  const valueStyle: React.CSSProperties = {
    color: 'hsl(var(--ds-foreground))',
    fontSize: '0.875rem',
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{children}</div>
    </div>
  );

  const EmptyField = ({ label }: { label: string }) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, fontStyle: 'italic', opacity: 0.5 }}>—</div>
    </div>
  );

  const formatNumber = (n: number | null) => {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString('id-ID');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        style={{
          backgroundColor: 'hsl(var(--ds-card))',
          border: '1px solid hsl(var(--ds-border))',
          maxHeight: '85vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--ds-border))',
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(0, 174, 239, 0.13)', color: '#00aeef' }}
              >
                {kode}
              </span>
              {detail && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  backgroundColor: 'hsl(var(--ds-muted))',
                  color: 'hsl(var(--ds-muted-foreground))',
                  border: '1px solid hsl(var(--ds-border))',
                }}>
                  {detail.pilar}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold mt-1" style={{ color: 'hsl(var(--ds-foreground))' }}>
              {detail?.nama_indikator ?? 'Detail Indikator'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'hsl(var(--ds-muted-foreground))' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 80px)', padding: '1.5rem' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={28} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileX size={36} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
                Gagal memuat data
              </p>
            </div>
          ) : detail ? (
            <div>
              {/* OPD */}
              <Field label="OPD Penanggung Jawab">
                <div className="flex flex-wrap gap-1">
                  {detail.opd_list.map((opd, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'hsl(var(--ds-muted))',
                        color: 'hsl(var(--ds-muted-foreground))',
                        border: '1px solid hsl(var(--ds-border))',
                      }}
                    >
                      {opd}
                    </span>
                  ))}
                </div>
              </Field>

              {/* Divider */}
              <div style={{ borderBottom: '1px solid hsl(var(--ds-border))', margin: '0.5rem 0 1.25rem' }} />

              {/* Grid layout for key-value pairs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
                <Field label="Sumber Data">{detail.sumber_data || '—'}</Field>
                <Field label="Baseline 2024">{formatNumber(detail.baseline_2024)}</Field>
              </div>

              <Field label="Pengintegrasian Dalam Dokrenda">{detail.dokrenda || '—'}</Field>

              {/* Divider */}
              <div style={{ borderBottom: '1px solid hsl(var(--ds-border))', margin: '0.5rem 0 1.25rem' }} />

              {/* Kendala */}
              {detail.kendala ? (
                <Field label="Kendala">
                  <div
                    style={{
                      backgroundColor: 'hsl(var(--ds-muted))',
                      border: '1px solid hsl(var(--ds-border))',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {detail.kendala}
                  </div>
                </Field>
              ) : (
                <EmptyField label="Kendala" />
              )}

              {/* Inovasi */}
              {detail.inovasi ? (
                <Field label="Inovasi">
                  <div
                    style={{
                      backgroundColor: 'hsl(var(--ds-muted))',
                      border: '1px solid hsl(var(--ds-border))',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {detail.inovasi}
                  </div>
                </Field>
              ) : (
                <EmptyField label="Inovasi" />
              )}

              {/* Divider */}
              <div style={{ borderBottom: '1px solid hsl(var(--ds-border))', margin: '0.5rem 0 1.25rem' }} />

              {/* Rencana Aksi + Status */}
              <div>
                <div className="flex items-center gap-2" style={labelStyle}>
                  <ListChecks size={13} />
                  <span>Rencana Aksi ({detail.renaksi_programs?.length ?? 0})</span>
                </div>
                {!detail.renaksi_programs || detail.renaksi_programs.length === 0 ? (
                  <p style={{ ...valueStyle, fontStyle: 'italic', opacity: 0.5 }}>
                    Belum ada rencana aksi untuk indikator ini
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {detail.renaksi_programs.map((r: IndikatorRenaksiProgram) => {
                      const st = renaksiStatusStyle(r.status);
                      return (
                        <div
                          key={r.id}
                          style={{
                            backgroundColor: 'hsl(var(--ds-muted))',
                            border: '1px solid hsl(var(--ds-border))',
                            borderRadius: '0.5rem',
                            padding: '0.625rem 0.875rem',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div style={{ minWidth: 0 }}>
                              <p style={{ ...valueStyle, fontWeight: 500, lineHeight: 1.4 }}>
                                {r.rencana_aksi}
                              </p>
                              <p style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                {r.dinas} · {r.tahun}
                                {r.target !== '-' ? ` · Target: ${r.target}` : ''}
                                {r.realisasi !== '-' ? ` · Realisasi: ${r.realisasi}` : ''}
                              </p>
                            </div>
                            <span
                              className="shrink-0 font-medium rounded-lg"
                              style={{
                                padding: '0.2rem 0.625rem',
                                fontSize: '0.6875rem',
                                backgroundColor: st.bg,
                                color: st.color,
                                whiteSpace: 'nowrap',
                              }}
                            >
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
