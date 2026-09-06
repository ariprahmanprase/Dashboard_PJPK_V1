import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Loader2, ListOrdered, Target, ClipboardCheck } from 'lucide-react';
import ScorecardPopupModal from '@/components/ScorecardPopupModal';
import type { RenaksiProgramRow } from '@/types';

interface RankRenaksiRow {
  peringkat: number;
  opd: string;
  renaksi_total: number;
  renaksi_tercapai: number;
  renaksi_terlaksana: number;
  pct_tercapai: number;
  skor: number;
}
interface RankIndikatorRow {
  peringkat: number;
  opd: string;
  indikator_on_track: number;
  indikator_total: number;
  pct_on_track: number;
  skor: number;
}
interface RankResponse {
  renaksi: RankRenaksiRow[];
  indikator: RankIndikatorRow[];
}

const TAHUN_LIST = ['2025', '2026', '2027', '2028', '2029'];

const MEDAL = [
  { color: '#eab308', bg: 'rgba(234,179,8,0.12)', label: 'Juara 1' },
  { color: '#94a3b8', bg: 'rgba(148,163,184,0.14)', label: 'Juara 2' },
  { color: '#d97706', bg: 'rgba(217,119,6,0.12)', label: 'Juara 3' },
];

export default function RankPage() {
  const [tahun, setTahun] = useState('2025');
  const [data, setData] = useState<RankResponse>({ renaksi: [], indikator: [] });
  const [loading, setLoading] = useState(true);

  // Popup detail renaksi per OPD
  const [popupOpd, setPopupOpd] = useState<string | null>(null);
  const [popupRows, setPopupRows] = useState<RenaksiProgramRow[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/rank-opd?tahun=${tahun}`)
      .then(r => r.json())
      .then((res: RankResponse) => setData(res))
      .catch(err => console.error('[PJPK] rank fetch error:', err))
      .finally(() => setLoading(false));
  }, [tahun]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header + filter tahun */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--ds-foreground))' }}>Peringkat OPD</h2>
          <p className="text-sm mt-1.5" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
            Dua papan peringkat: pelaksanaan rencana aksi & kinerja indikator · tahun {tahun}
          </p>
        </div>
        <select value={tahun} onChange={e => setTahun(e.target.value)} className="ds-select" style={{ minWidth: 120 }}>
          {TAHUN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="ds-card flex items-center justify-center" style={{ padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* ── Papan 1: Renaksi Tercapai ── */}
          <RankBoard
            icon={<ClipboardCheck size={15} />}
            title="Renaksi Tercapai"
            subtitle="Persentase rencana aksi yang tercapai"
            rows={data.renaksi}
            emptyText={`Belum ada data renaksi untuk tahun ${tahun}`}
            onOpen={openOpdDetail}
            getPct={r => r.pct_tercapai}
            getCount={r => `${r.renaksi_tercapai}/${r.renaksi_total}`}
            countLabel="Tercapai"
            detailText={r => `${r.renaksi_tercapai} dari ${r.renaksi_total} renaksi tercapai`}
          />

          {/* ── Papan 2: Indikator On Track ── */}
          <RankBoard
            icon={<Target size={15} />}
            title="Indikator On Track"
            subtitle="Persentase indikator berstatus On Track"
            rows={data.indikator}
            emptyText={`Belum ada data indikator untuk tahun ${tahun}`}
            onOpen={openOpdDetail}
            getPct={r => r.pct_on_track}
            getCount={r => `${r.indikator_on_track}/${r.indikator_total}`}
            countLabel="On Track"
            detailText={r => `${r.indikator_on_track} dari ${r.indikator_total} indikator On Track`}
          />
        </div>
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

/* ── Satu papan peringkat (podium + leaderboard) ── */
interface BoardProps<T extends { peringkat: number; opd: string; skor: number }> {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  rows: T[];
  emptyText: string;
  onOpen: (opd: string) => void;
  getPct: (r: T) => number;
  getCount: (r: T) => string;
  countLabel: string;
  detailText: (r: T) => string;
}

function RankBoard<T extends { peringkat: number; opd: string; skor: number }>({
  icon, title, subtitle, rows, emptyText, onOpen, getPct, getCount, countLabel, detailText,
}: BoardProps<T>) {
  const podium = rows.slice(0, 3);
  const maxSkor = rows.length ? Math.max(...rows.map(d => d.skor), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Judul papan */}
      <p className="ds-section-label">{icon} {title} <span style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.6, fontWeight: 400 }}>· {subtitle}</span></p>

      {rows.length === 0 ? (
        <div className="ds-card flex flex-col items-center justify-center" style={{ padding: '3rem', gap: '0.5rem' }}>
          <Trophy size={30} style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>{emptyText}</p>
        </div>
      ) : (
        <>
          {/* Podium 1-3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', alignItems: 'end' }}>
            {[podium[1], podium[0], podium[2]].map((row, idx) => {
              if (!row) return <div key={idx} />;
              const rank = row.peringkat;
              const m = MEDAL[rank - 1];
              const isFirst = rank === 1;
              return (
                <div
                  key={row.opd}
                  className="ds-card"
                  onClick={() => onOpen(row.opd)}
                  title="Lihat daftar rencana aksi"
                  style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transform: isFirst ? 'translateY(-6px)' : 'none',
                    border: `1px solid ${m.color}`,
                    boxShadow: isFirst ? `0 6px 18px ${m.bg}` : undefined,
                  }}
                >
                  <div style={{ width: 40, height: 40, margin: '0 auto 0.5rem', borderRadius: '999px', background: m.bg, display: 'grid', placeItems: 'center' }}>
                    {rank === 1 ? <Trophy size={20} style={{ color: m.color }} />
                      : rank === 2 ? <Medal size={20} style={{ color: m.color }} />
                      : <Award size={20} style={{ color: m.color }} />}
                  </div>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: m.color }}>{m.label}</p>
                  <p className="font-bold" style={{ color: 'hsl(var(--ds-foreground))', marginTop: '0.125rem', fontSize: '0.813rem', lineHeight: 1.25, overflowWrap: 'anywhere' }}>{row.opd}</p>
                  <p style={{ fontSize: '1.375rem', fontWeight: 800, color: 'hsl(var(--ds-primary))', marginTop: '0.375rem', fontVariantNumeric: 'tabular-nums' }}>{getPct(row)}%</p>
                  <p style={{ fontSize: '0.625rem', color: 'hsl(var(--ds-muted-foreground))' }}>{detailText(row)}</p>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="ds-card" style={{ overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 480, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--ds-border))', background: 'hsl(var(--ds-muted) / 0.4)' }}>
                    <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.625rem 1rem', textAlign: 'left' }}>Rank</th>
                    <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.625rem 1rem', textAlign: 'left' }}>OPD</th>
                    <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.625rem 1rem', textAlign: 'center' }}>{countLabel}</th>
                    <th className="font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))', fontSize: '0.688rem', padding: '0.625rem 1rem', textAlign: 'left' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.opd}
                      onClick={() => onOpen(row.opd)}
                      title="Lihat daftar rencana aksi"
                      style={{ borderBottom: '1px solid hsl(var(--ds-border))', cursor: 'pointer' }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 700, color: row.peringkat <= 3 ? MEDAL[row.peringkat - 1].color : 'hsl(var(--ds-muted-foreground))', width: 48 }}>
                        {row.peringkat}
                      </td>
                      <td style={{ padding: '0.625rem 1rem', fontWeight: 500, color: 'hsl(var(--ds-foreground))', fontSize: '0.813rem' }}>{row.opd}</td>
                      <td style={{ padding: '0.625rem 1rem', textAlign: 'center', fontSize: '0.813rem', fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-primary))', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {getCount(row)}
                      </td>
                      <td style={{ padding: '0.625rem 1rem', minWidth: 130 }}>
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: 7, borderRadius: 999, background: 'hsl(var(--ds-muted))', overflow: 'hidden' }}>
                            <div style={{ width: `${(row.skor / maxSkor) * 100}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--ds-primary)), hsl(var(--ds-secondary)))', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: 'hsl(var(--ds-foreground))', fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', minWidth: 40, textAlign: 'right' }}>
                            {getPct(row)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
