import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Loader2, ListOrdered } from 'lucide-react';
import ScorecardPopupModal from '@/components/ScorecardPopupModal';
import type { RenaksiProgramRow } from '@/types';

interface RankRow {
  peringkat: number;
  opd: string;
  renaksi_total: number;
  renaksi_tercapai: number;
  renaksi_terlaksana: number;
  pct_tercapai: number;
  skor: number;
}

const TAHUN_LIST = ['2025', '2026', '2027', '2028', '2029'];

const MEDAL = [
  { color: '#eab308', bg: 'rgba(234,179,8,0.12)', label: 'Juara 1' }, // emas
  { color: '#94a3b8', bg: 'rgba(148,163,184,0.14)', label: 'Juara 2' }, // perak
  { color: '#d97706', bg: 'rgba(217,119,6,0.12)', label: 'Juara 3' }, // perunggu
];

export default function RankPage() {
  const [tahun, setTahun] = useState('2025');
  const [data, setData] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup detail renaksi per OPD
  const [popupOpd, setPopupOpd] = useState<string | null>(null);
  const [popupRows, setPopupRows] = useState<RenaksiProgramRow[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);

  async function openOpdDetail(opd: string) {
    setPopupOpd(opd);
    setPopupRows([]);
    setPopupLoading(true);
    try {
      const resp = await fetch(`/api/dashboard/renaksi-program-list?tahun=${tahun}&dinas_induk=${encodeURIComponent(opd)}`);
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      setPopupRows(await resp.json());
    } catch (err) {
      console.error('[PJPK] rank detail fetch error:', err);
    } finally {
      setPopupLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/rank-opd?tahun=${tahun}`)
      .then(r => r.json())
      .then((rows: RankRow[]) => setData(rows))
      .catch(err => console.error('[PJPK] rank fetch error:', err))
      .finally(() => setLoading(false));
  }, [tahun]);

  const podium = data.slice(0, 3);
  const maxSkor = data.length ? Math.max(...data.map(d => d.skor), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header + filter tahun */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--ds-foreground))' }}>Peringkat OPD</h2>
          <p className="text-sm mt-1.5" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
            Berdasarkan persentase rencana aksi yang Tercapai pada tahun {tahun}
          </p>
        </div>
        <select
          value={tahun}
          onChange={e => setTahun(e.target.value)}
          className="ds-select"
          style={{ minWidth: 120 }}
        >
          {TAHUN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="ds-card flex items-center justify-center" style={{ padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
        </div>
      ) : data.length === 0 ? (
        <div className="ds-card flex flex-col items-center justify-center" style={{ padding: '4rem', gap: '0.5rem' }}>
          <Trophy size={36} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Belum ada data untuk tahun {tahun}</p>
        </div>
      ) : (
        <>
          {/* ── Podium Juara 1-3 ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            {/* Urutan tampilan: 2, 1, 3 (juara 1 di tengah lebih menonjol) */}
            {[podium[1], podium[0], podium[2]].map((row, idx) => {
              if (!row) return <div key={idx} />;
              const rank = row.peringkat;
              const m = MEDAL[rank - 1];
              const isFirst = rank === 1;
              return (
                <div
                  key={row.opd}
                  className="ds-card"
                  onClick={() => openOpdDetail(row.opd)}
                  title="Lihat daftar rencana aksi"
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    order: idx,
                    cursor: 'pointer',
                    transform: isFirst ? 'translateY(-8px)' : 'none',
                    border: `1px solid ${m.color}`,
                    boxShadow: isFirst ? `0 8px 24px ${m.bg}` : undefined,
                  }}
                >
                  <div
                    style={{
                      width: 52, height: 52, margin: '0 auto 0.75rem',
                      borderRadius: '999px', background: m.bg,
                      display: 'grid', placeItems: 'center',
                    }}
                  >
                    {rank === 1 ? <Trophy size={26} style={{ color: m.color }} />
                      : rank === 2 ? <Medal size={26} style={{ color: m.color }} />
                      : <Award size={26} style={{ color: m.color }} />}
                  </div>
                  <p style={{ fontSize: '0.688rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: m.color }}>
                    {m.label}
                  </p>
                  <p className="font-bold" style={{ color: 'hsl(var(--ds-foreground))', marginTop: '0.25rem', fontSize: isFirst ? '1.05rem' : '0.95rem', lineHeight: 1.3 }}>
                    {row.opd}
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--ds-primary))', marginTop: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>
                    {row.pct_tercapai}%
                  </p>
                  <p style={{ fontSize: '0.688rem', color: 'hsl(var(--ds-muted-foreground))' }}>
                    {row.renaksi_tercapai} dari {row.renaksi_total} renaksi tercapai
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Leaderboard lengkap ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <p className="ds-section-label">
              <ListOrdered size={15} /> Papan Peringkat <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>— {data.length} OPD</span>
            </p>
            <div className="ds-card" style={{ overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 680, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--ds-border))', background: 'hsl(var(--ds-muted) / 0.4)' }}>
                      <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.75rem 1.25rem', textAlign: 'left' }}>Rank</th>
                      <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.75rem 1.25rem', textAlign: 'left' }}>OPD</th>
                      <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.75rem 1.25rem', textAlign: 'center' }}>Total Renaksi</th>
                      <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.75rem 1.25rem', textAlign: 'center' }}>Tercapai</th>
                      <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.75rem 1.25rem', textAlign: 'left' }}>% Tercapai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(row => (
                      <tr
                        key={row.opd}
                        onClick={() => openOpdDetail(row.opd)}
                        title="Lihat daftar rencana aksi"
                        style={{ borderBottom: '1px solid hsl(var(--ds-border))', cursor: 'pointer' }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 700, color: row.peringkat <= 3 ? MEDAL[row.peringkat - 1].color : 'hsl(var(--ds-muted-foreground))', width: 60 }}>
                          {row.peringkat}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 500, color: 'hsl(var(--ds-foreground))' }}>{row.opd}</td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center', color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.813rem', fontVariantNumeric: 'tabular-nums' }}>
                          {row.renaksi_total}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontSize: '0.813rem', fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ color: 'hsl(var(--ds-primary))', fontWeight: 600 }}>{row.renaksi_tercapai}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', minWidth: 180 }}>
                          <div className="flex items-center gap-2">
                            <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'hsl(var(--ds-muted))', overflow: 'hidden' }}>
                              <div style={{ width: `${(row.skor / maxSkor) * 100}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--ds-primary)), hsl(var(--ds-secondary)))', borderRadius: 999 }} />
                            </div>
                            <span style={{ fontWeight: 700, color: 'hsl(var(--ds-foreground))', fontVariantNumeric: 'tabular-nums', fontSize: '0.813rem', minWidth: 44, textAlign: 'right' }}>
                              {row.pct_tercapai}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Popup detail renaksi per OPD ── */}
      {popupOpd !== null && popupLoading && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPopupOpd(null)}
        >
          <div className="ds-card flex items-center justify-center" style={{ padding: '3rem 4rem' }} onClick={e => e.stopPropagation()}>
            <Loader2 className="animate-spin" size={28} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
          </div>
        </div>
      )}
      <ScorecardPopupModal
        open={popupOpd !== null && !popupLoading}
        title={`Rencana Aksi — ${popupOpd ?? ''}`}
        rows={popupRows}
        onClose={() => setPopupOpd(null)}
      />
    </div>
  );
}
