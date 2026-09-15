import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Table2, RotateCcw } from 'lucide-react';
import ScoreCard from '@/components/ScoreCard';
import type { RenaksiProgramRow, RenaksiProgramSummary, FilterOptions, IndikatorOption } from '@/types';
import RenaksiProgramTable from '@/components/RenaksiProgramTable';
import ScorecardPopupModal from '@/components/ScorecardPopupModal';
import RenaksiStatusBar from '@/components/RenaksiStatusBar';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';
import { opdInduk } from '@/lib/opd';
import { usePersistentState, clearPersistent } from '@/hooks/usePersistentState';
import { useReveal } from '@/hooks/useReveal';

const FILTER_KEY = 'pjpk-draft-filter-renaksi';
const DEFAULT_FILTER = { tahun: '', pilarId: '', opdId: '', dinas: '', indikatorId: '', statusRenaksi: '', search: '' };

// ── Helpers ──────────────────────────────────────────
async function apiFetch<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

// ── Component ────────────────────────────────────────
export default function RencanaAksiPage() {
  // Filters — disimpan sebagai satu objek persisten (bertahan saat pindah halaman)
  const [filter, setFilter] = usePersistentState(FILTER_KEY, DEFAULT_FILTER);
  const { tahun, pilarId, opdId, dinas, indikatorId, statusRenaksi, search } = filter;
  const patchFilter = (patch: Partial<typeof DEFAULT_FILTER>) => setFilter(f => ({ ...f, ...patch }));
  const setTahun = (v: string) => patchFilter({ tahun: v });
  const setDinas = (v: string) => patchFilter({ dinas: v });
  const setIndikatorId = (v: string) => patchFilter({ indikatorId: v });
  const setStatusRenaksi = (v: string) => patchFilter({ statusRenaksi: v });
  const setSearch = (v: string) => patchFilter({ search: v });

  // ── Reset semua filter ──
  function handleResetFilter() {
    clearPersistent(FILTER_KEY);
    setFilter(DEFAULT_FILTER);
  }

  const hasActiveFilter = Boolean(tahun || pilarId || opdId || dinas || indikatorId || statusRenaksi || search);

  // ── Cascading: ganti pilar → reset indikator bila tidak cocok ──
  function handlePilarChange(value: string) {
    patchFilter({ pilarId: value });
    if (indikatorId) {
      const sumber = programIndikatorList;
      const masihCocok = value !== '' && sumber.some(
        i => String(i.id) === indikatorId && String(i.pilar_id) === value
      );
      if (!masihCocok) setIndikatorId('');
    }
  }

  // Data Program (Excel)
  const [programData, setProgramData] = useState<RenaksiProgramRow[]>([]);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [dinasList, setDinasList] = useState<string[]>([]);
  const [programIndikatorList, setProgramIndikatorList] = useState<IndikatorOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup scorecard: daftar program per status
  const [scorecardPopup, setScorecardPopup] = useState<string | null>(null);

  const scorecardPopupRows = useMemo(() => {
    if (!scorecardPopup) return [];
    if (scorecardPopup === 'Total Program') return programData;
    if (scorecardPopup === 'Total OPD') {
      const seen = new Set<string>();
      return programData.filter(r => (seen.has(r.dinas) ? false : (seen.add(r.dinas), true)));
    }
    return programData.filter(r => r.status === scorecardPopup);
  }, [scorecardPopup, programData]);

  // Stacked bar dihitung dari programData (hasil filter aktif) supaya mengikuti semua filter
  const statusBarData = useMemo<RenaksiProgramSummary>(() => {
    const count = (s: string) => programData.filter(r => renaksiStatusStyle(r.status).label === s).length;
    const tercapai = count('Tercapai');
    const hampir = count('Hampir Tercapai');
    const tidak = count('Tidak Tercapai');
    const belum = count('Belum diisi');
    const total = programData.length;
    return {
      total,
      total_dinas: new Set(programData.map(r => r.dinas)).size,
      terlaksana: tercapai + hampir,
      tercapai,
      hampir_tercapai: hampir,
      tidak_tercapai: tidak,
      belum_diisi: belum,
      tidak_terlaksana: tidak,
      persentase: total > 0 ? Math.round(((tercapai + hampir) / total) * 100) : 0,
    };
  }, [programData]);

  // ── Fetch Data ─────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch filter options and dinas list in parallel
      const [opts, dinasOpts] = await Promise.all([
        filterOptions ? Promise.resolve(filterOptions) : apiFetch<FilterOptions>('/api/filters'),
        dinasList.length > 0 ? Promise.resolve(dinasList) : apiFetch<string[]>('/api/dashboard/renaksi-program-dinas'),
      ]);

      if (!filterOptions) setFilterOptions(opts);
      if (dinasList.length === 0 && dinasOpts) setDinasList(dinasOpts);

      // Build params for program (Excel) - use Dinas filter
      const progParams = new URLSearchParams();
      if (tahun) progParams.set('tahun', tahun);
      if (dinas) progParams.set('dinas', dinas);
      if (pilarId) progParams.set('pilar_id', pilarId);
      if (indikatorId) progParams.set('indikator_id', indikatorId);
      if (statusRenaksi) progParams.set('status_renaksi', statusRenaksi);
      if (search) progParams.set('search', search);

      // Fetch dataset program (scorecard dihitung dari data ini supaya mengikuti semua filter)
      const progList = await apiFetch<RenaksiProgramRow[]>(`/api/dashboard/renaksi-program-list?${progParams}`);

      setProgramData(progList);
    } catch (err) {
      console.error('[PJPK] rencana aksi fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiFetch<FilterOptions>('/api/filters').then(setFilterOptions);
    apiFetch<string[]>('/api/dashboard/renaksi-program-dinas').then(setDinasList);
    apiFetch<IndikatorOption[]>('/api/dashboard/renaksi-program-indikators').then(setProgramIndikatorList);
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [tahun, pilarId, dinas, indikatorId, statusRenaksi, search]);

  // ── Styles ────────────────────────────────────────
  const baseSelect: React.CSSProperties = {
    height: 40,
    padding: '0 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid hsl(var(--ds-border))',
    backgroundColor: 'hsl(var(--ds-card))',
    color: 'hsl(var(--ds-foreground))',
    fontSize: '0.875rem',
    cursor: 'pointer',
    outline: 'none',
    minWidth: 160,
  };

  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className="reveal-scope" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div data-reveal data-reveal-delay="0">
        <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--ds-foreground))' }}>Rencana Aksi</h2>
        <p className="text-sm mt-1.5" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
          Monitoring pelaksanaan rencana aksi pembangunan kependudukan
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-xl border" style={{ backgroundColor: 'hsl(var(--ds-card))', borderColor: 'hsl(var(--ds-border))', padding: '1.5rem' }} data-reveal data-reveal-delay="70">
        <div className="flex items-center gap-2.5" style={{ marginBottom: '1rem' }}>
          <Filter size={16} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>Filter</p>
        </div>
        <div className="filter-full" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
          {/* Tahun - show for both tabs */}
          <select value={tahun} onChange={e => setTahun(e.target.value)} style={{ ...baseSelect, minWidth: 130 }} className="mobile-full">
            <option value="">Semua Tahun</option>
            {['2025', '2026', '2027', '2028', '2029'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Pilar - show for both tabs; mempersempit opsi indikator */}
          <select value={pilarId} onChange={e => handlePilarChange(e.target.value)} style={{ ...baseSelect, minWidth: 200 }}>
            <option value="">Semua Pilar</option>
            {filterOptions?.pilar.map(p => <option key={p.id} value={p.id}>{p.nama_pilar}</option>)}
          </select>

          {/* Indikator - show for both tabs; menyesuaikan pilar yang dipilih */}
          <select value={indikatorId} onChange={e => setIndikatorId(e.target.value)} style={{ ...baseSelect, minWidth: 220 }}>
            <option value="">Semua Indikator</option>
            {programIndikatorList
              .filter(i => !pilarId || String(i.pilar_id) === pilarId)
              .map(i => (
                <option key={i.id} value={i.id} title={i.nama_indikator}>{i.nama_indikator.length > 50 ? i.nama_indikator.slice(0, 50) + '…' : i.nama_indikator}</option>
              ))}
          </select>

          {/* OPD yang mengampu — dari dinas data renaksi */}
          <select value={dinas} onChange={e => setDinas(e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
            <option value="">Semua OPD yang mengampu</option>
            {[...new Set(dinasList.map(d => opdInduk(d)))].map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Status - show for both */}
          <select value={statusRenaksi} onChange={e => setStatusRenaksi(e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
            <option value="">Semua Status</option>
            <option value="Tercapai">Tercapai</option>
            <option value="Hampir Tercapai">Hampir Tercapai</option>
            <option value="Tidak Tercapai">Tidak Tercapai</option>
            <option value="Belum diisi">Belum diisi</option>
          </select>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'hsl(var(--ds-muted-foreground))' }} />
            <input
              type="text"
              placeholder="Cari rencana aksi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                height: 40,
                width: '100%',
                padding: '0 0.875rem 0 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid hsl(var(--ds-border))',
                backgroundColor: 'hsl(var(--ds-card))',
                color: 'hsl(var(--ds-foreground))',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={handleResetFilter}
            disabled={!hasActiveFilter}
            title="Reset semua filter"
            style={{
              height: 40,
              padding: '0 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid hsl(var(--ds-border))',
              backgroundColor: hasActiveFilter ? 'hsl(var(--ds-card))' : 'transparent',
              color: 'hsl(var(--ds-muted-foreground))',
              fontSize: '0.875rem',
              cursor: hasActiveFilter ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              opacity: hasActiveFilter ? 1 : 0.5,
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* ── Summary Cards (program) — di bawah filter ── */}
      {loading && !programData.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6" style={{ gap: '0.75rem' }} data-reveal data-reveal-delay="140">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-5 animate-pulse"
              style={{
                backgroundColor: 'hsl(var(--ds-card))',
                borderColor: 'hsl(var(--ds-border))',
              }}
            >
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-2.5" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6" style={{ gap: '0.75rem' }} data-reveal data-reveal-delay="140">
          <ScoreCard label="Total OPD" value={statusBarData.total_dinas} variant="info" description="Jumlah OPD pengampu rencana aksi (mengikuti filter)" onClick={() => setScorecardPopup('Total OPD')} />
          <ScoreCard label="Total Program" value={statusBarData.total} variant="info" description="Jumlah program rencana aksi yang terpantau (mengikuti filter)" onClick={() => setScorecardPopup('Total Program')} />
          <ScoreCard label="Tercapai" value={statusBarData.tercapai} variant="success" description="Program dengan realisasi sesuai/melampaui target" onClick={() => setScorecardPopup('Tercapai')} />
          <ScoreCard label="Hampir Tercapai" value={statusBarData.hampir_tercapai} variant="warning" description="Program dengan realisasi mendekati target" onClick={() => setScorecardPopup('Hampir Tercapai')} />
          <ScoreCard label="Tidak Tercapai" value={statusBarData.tidak_tercapai} variant="danger" description="Program dengan realisasi jauh di bawah target" onClick={() => setScorecardPopup('Tidak Tercapai')} />
          <ScoreCard label="Belum Diisi" value={statusBarData.belum_diisi} variant="default" description="Program yang belum menginput realisasi" onClick={() => setScorecardPopup('Belum diisi')} />
        </div>
      )}

      {/* ── Stacked bar persentase status — mengikuti filter aktif ── */}
      <div data-reveal data-reveal-delay="200">
        <RenaksiStatusBar
          data={statusBarData}
          loading={loading && !programData.length}
          onSegmentClick={(status) => setScorecardPopup(status)}
        />
      </div>

      {/* ── Tabel Program ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} data-reveal>
        <div className="flex items-center gap-2.5">
          <Table2 size={16} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
            Tabel Program Rencana Aksi
          </p>
          {!loading && (
            <span className="text-xs ml-1" style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.6 }}>
              — {programData.length} data
            </span>
          )}
        </div>
        <RenaksiProgramTable data={programData} loading={loading} />
      </div>

      {/* Tabel footer */}
      {!loading && (
        <p className="text-xs text-right" style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.6 }}>
          Menampilkan {programData.length} rencana aksi
        </p>
      )}

      {/* ── Scorecard Popup (Program) ── */}
      <ScorecardPopupModal
        open={scorecardPopup !== null}
        title={scorecardPopup === 'Total OPD' ? 'Daftar OPD Pengampu' : scorecardPopup === 'Total Program' ? 'Semua Program' : `Program — ${scorecardPopup ?? ''}`}
        rows={scorecardPopupRows}
        onClose={() => setScorecardPopup(null)}
      />
    </div>
  );
}
