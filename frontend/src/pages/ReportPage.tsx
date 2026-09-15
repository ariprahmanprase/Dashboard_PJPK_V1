import { useState, useEffect, useMemo } from 'react';
import { Filter, Table2 } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import ScoreCardGrid from '@/components/ScoreCardGrid';
import type { ScorecardKey } from '@/components/ScoreCardGrid';
import DataTable from '@/components/DataTable';
import RenaksiModal from '@/components/RenaksiModal';
import IndikatorDetailModal from '@/components/IndikatorDetailModal';
import StatusDetailModal from '@/components/StatusDetailModal';
import ChartCombo from '@/components/ChartCombo';
import PieRenaksi from '@/components/PieRenaksi';
import PieStatus from '@/components/PieStatus';
import BarPerPilar from '@/components/BarPerPilar';
import BarPerOpd from '@/components/BarPerOpd';
import SmallMultipleIndikator from '@/components/SmallMultipleIndikator';
import HeatmapGrid from '@/components/HeatmapGrid';
import { usePersistentState, clearPersistent } from '@/hooks/usePersistentState';
import { useReveal } from '@/hooks/useReveal';
import type { Scorecards, TableRow, FilterOptions, RenaksiItem, ChartDataPoint, RenaksiPieData, RenaksiListItem, PerPilarItem, PerOpdItem, HeatmapRow, ChartIndikatorEntry } from '@/types';

const FILTER_KEY = 'pjpk-draft-filter-indikator';

// ── Helpers ──────────────────────────────────────────
function buildParams(f: { tahun: string; opdId: string; pilarId: string; indikatorId: string; statusTl: string }): string {
  const p = new URLSearchParams();
  if (f.tahun) p.set('tahun', f.tahun);
  if (f.opdId) p.set('opd_id', f.opdId);
  if (f.pilarId) p.set('pilar_id', f.pilarId);
  if (f.indikatorId) p.set('indikator_id', f.indikatorId);
  if (f.statusTl) p.set('status_tl', f.statusTl);
  return p.toString();
}

async function apiFetch<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

// ── Component ────────────────────────────────────────
export default function ReportPage() {
  // Filter states — disimpan sebagai satu objek agar persisten antar-halaman
  const [filter, setFilter] = usePersistentState(FILTER_KEY, {
    tahun: '2025', opdId: '', pilarId: '', indikatorId: '', statusTl: '',
  });
  const { tahun, opdId, pilarId, indikatorId, statusTl } = filter;
  const [scorecardKey, setScorecardKey] = useState<ScorecardKey | null>(null);

  // Data states
  const [scorecards, setScorecards] = useState<Scorecards | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal renaksi states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKode, setModalKode] = useState('');
  const [modalNama, setModalNama] = useState('');
  const [renaksiData, setRenaksiData] = useState<RenaksiItem[]>([]);
  const [renaksiLoading, setRenaksiLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'indikator' | 'all'>('indikator');

  // Modal status detail states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusDetailData, setStatusDetailData] = useState<TableRow[]>([]);
  const [statusDetailLoading, setStatusDetailLoading] = useState(false);

  // Chart states
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [renaksiPie, setRenaksiPie] = useState<RenaksiPieData | null>(null);
  const [perPilar, setPerPilar] = useState<PerPilarItem[]>([]);
  const [perOpd, setPerOpd] = useState<PerOpdItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapRow[]>([]);
  const [chartPerIndikator, setChartPerIndikator] = useState<ChartIndikatorEntry[]>([]);

  // ── fetchData helper ──────────────────────────────
  const fetchDataFor = async (filters: { tahun: string; opdId: string; pilarId: string; indikatorId: string; statusTl: string }) => {
    setLoading(true);
    try {
      const params = buildParams(filters);
      // Heatmap: no status_tl, no tahun filter
      const hmParams = new URLSearchParams();
      if (filters.opdId) hmParams.set('opd_id', filters.opdId);
      if (filters.pilarId) hmParams.set('pilar_id', filters.pilarId);
      if (filters.indikatorId) hmParams.set('indikator_id', filters.indikatorId);

      const [sc, tbl, ch, rp, pp, po, hm, cpi] = await Promise.all([
        apiFetch<Scorecards>(`/api/dashboard/scorecards?${params}`),
        apiFetch<TableRow[]>(`/api/dashboard/table?${params}`),
        apiFetch<ChartDataPoint[]>(`/api/dashboard/chart?${params}`),
        apiFetch<RenaksiPieData>(`/api/dashboard/renaksi-pie?${params}`),
        apiFetch<PerPilarItem[]>(`/api/dashboard/per-pilar?${params}`),
        apiFetch<PerOpdItem[]>(`/api/dashboard/per-opd?${params}`),
        apiFetch<HeatmapRow[]>(`/api/dashboard/heatmap?${hmParams}`),
        apiFetch<ChartIndikatorEntry[]>(`/api/dashboard/chart-per-indikator?${params}`),
      ]);
      setScorecards(sc);
      setTableData(tbl);
      setChartData(ch);
      setRenaksiPie(rp);
      setPerPilar(pp);
      setPerOpd(po);
      setHeatmapData(hm);
      setChartPerIndikator(cpi);
    } catch (err) {
      console.error('[PJPK] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Initial mount — pakai filter tersimpan (state awal sudah dari localStorage) ──
  useEffect(() => {
    apiFetch<FilterOptions>('/api/filters').then(setFilterOptions);
    fetchDataFor(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const DEFAULT_FILTER = { tahun: '2025', opdId: '', pilarId: '', indikatorId: '', statusTl: '' };

  // ── Scorecard click ───────────────────────────────
  function handleScorecardClick(key: ScorecardKey) {
    if (scorecardKey === key) {
      // Deselect → kembali ke default
      setScorecardKey(null);
      setFilter(DEFAULT_FILTER);
      fetchDataFor(DEFAULT_FILTER);
      return;
    }

    // Scorecard "Capaian Belum Diinput": filter tabel di client (capaian null)
    // + buka popup daftar indikator yang belum diinput
    if (key === 'capaian_belum') {
      setScorecardKey(key);
      setFilter(DEFAULT_FILTER);
      fetchDataFor(DEFAULT_FILTER);
      openStatusModal('Belum Diisi');
      return;
    }

    let newStatus = '';
    if (key === 'on_track') newStatus = 'On Track';
    else if (key === 'warning') newStatus = 'Warning';
    else if (key === 'alert') newStatus = 'Alert';

    const next = { ...DEFAULT_FILTER, statusTl: newStatus };
    setScorecardKey(key);
    setFilter(next);
    fetchDataFor(next);
  }

  // ── Ambil daftar indikator per status lalu buka popup ──
  async function openStatusModal(status: string) {
    setStatusModalTitle(status);
    setStatusModalOpen(true);
    setStatusDetailLoading(true);
    setStatusDetailData([]);

    try {
      const params = new URLSearchParams();
      params.set('tahun', tahun || '2025');
      params.set('status_tl', status);
      const resp = await fetch(`/api/dashboard/table?${params}`);
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const json: TableRow[] = await resp.json();
      setStatusDetailData(json);
    } catch (err) {
      console.error('[PJPK] status detail fetch error:', err);
    } finally {
      setStatusDetailLoading(false);
    }
  }

  // ── Filter dropdown change ─────────────────────────
  function handleFilterChange(_key: string, value: string) {
    setScorecardKey(null);

    const newState = {
      tahun: _key === 'tahun' ? value : tahun,
      opdId: _key === 'opd_id' ? value : opdId,
      pilarId: _key === 'pilar_id' ? value : pilarId,
      indikatorId: _key === 'indikator_id' ? value : indikatorId,
      statusTl: _key === 'status_tl' ? value : statusTl,
    };

    // Jika pilar berubah, reset indikator bila tidak termasuk pilar yang dipilih
    if (_key === 'pilar_id' && newState.indikatorId) {
      const masihCocok = value !== '' && filterOptions?.indikator.some(
        i => String(i.id) === newState.indikatorId && String(i.pilar_id) === value
      );
      if (!masihCocok) newState.indikatorId = '';
    }

    setFilter(newState);
    fetchDataFor(newState);
  }

  // ── Reset semua filter ke default ──────────────
  function handleResetFilter() {
    setScorecardKey(null);
    clearPersistent(FILTER_KEY);
    setFilter(DEFAULT_FILTER);
    fetchDataFor(DEFAULT_FILTER);
  }

  // ── PieStatus click (popup modal) ──────────────
  function handlePieStatusClick(status: string) {
    openStatusModal(status);
  }

  // ── Indikator Detail modal (klik baris tabel) ─────
  const [indikatorDetailOpen, setIndikatorDetailOpen] = useState(false);
  const [indikatorDetailKode, setIndikatorDetailKode] = useState('');

  function handleRowClick(row: TableRow) {
    setIndikatorDetailKode(row.kode);
    setIndikatorDetailOpen(true);
  }

  async function handlePieClick(status: string) {
    const params = buildParams({ tahun, opdId, pilarId, indikatorId, statusTl });
    const statusParam = encodeURIComponent(status);
    setModalMode('all');
    setModalKode(`Rencana aksi dengan status: ${status} (filter aktif)`);
    setModalNama('');
    setModalOpen(true);
    setRenaksiLoading(true);
    setRenaksiData([]);

    try {
      const resp = await fetch(`/api/dashboard/renaksi-program-list?${params}&status_renaksi=${statusParam}`);
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const json = await resp.json();
      setRenaksiData((json as Array<Record<string, unknown>>).map((r, i) => ({
        no: (r.no as number) ?? i + 1,
        indikator: Array.isArray(r.indikator) ? (r.indikator as string[]).join(', ') : String(r.indikator ?? '-'),
        rencana_aksi: String(r.rencana_aksi ?? '-'),
        opd: String(r.dinas ?? r.opd ?? '-'),
        tahun: String(r.tahun ?? '-'),
        status: String(r.status ?? '-'),
        catatan: (r.catatan as string | null) ?? null,
        // Field detail untuk popup renaksi (klik baris → detail seperti di heatmap)
        program: String(r.program ?? '-'),
        kode_program: String(r.kode_program ?? '-'),
        jenis_target: (r.jenis_target as 'kuantitatif' | 'kualitatif') ?? 'kualitatif',
        target: String(r.target ?? '-'),
        realisasi: String(r.realisasi ?? '-'),
        kendala: (r.kendala as string | null) ?? null,
        dokumentasi: (r.dokumentasi as string | null) ?? null,
        pilar: Array.isArray(r.pilar) ? (r.pilar as string[]) : [],
      })));
    } catch (err) {
      console.error('[PJPK] renaksi list fetch error:', err);
    } finally {
      setRenaksiLoading(false);
    }
  }

  // ── Client-side filter ────────────────────────────
  // Scorecard "Capaian Belum Diinput" selaras dengan status Belum Diisi backend
  // (termasuk indikator tanpa baris target_capaian), bukan hanya capaian null.
  const filteredTableData = useMemo(() => {
    if (scorecardKey === 'capaian_belum') return tableData.filter(r => r.status_tl === 'Belum Diisi');
    return tableData;
  }, [tableData, scorecardKey]);

  const filtersObj = { tahun, opd_id: opdId, pilar_id: pilarId, indikator_id: indikatorId, status_tl: statusTl };

  const revealRef = useReveal<HTMLDivElement>();

  return (
    <div ref={revealRef} className="reveal-scope" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div data-reveal data-reveal-delay="0">
        <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--ds-foreground))' }}>Indikator</h2>
        <p className="text-sm mt-1.5" style={{ color: 'hsl(var(--ds-muted-foreground))' }}>
          Monitoring 30 indikator pembangunan kependudukan Kabupaten Sidoarjo
        </p>
      </div>

      <div className="ds-card" style={{ padding: '1.5rem' }} data-reveal data-reveal-delay="70">
        <div className="flex items-center gap-2.5" style={{ marginBottom: '1.25rem' }}>
          <Filter size={15} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
          <p className="ds-section-label">Filter Data</p>
        </div>
        <FilterBar options={filterOptions} filters={filtersObj} onFilterChange={handleFilterChange} onReset={handleResetFilter} />
      </div>

      <div data-reveal data-reveal-delay="140">
        <ScoreCardGrid data={scorecards} loading={loading} activeKey={scorecardKey} onCardClick={handleScorecardClick} />
      </div>

      <div className="responsive-row" data-reveal data-reveal-delay="200">
        <div style={{ flex: '0 0 50%' }}>
          <ChartCombo data={chartData} loading={loading} perluPilihIndikator={!indikatorId} />
        </div>
        <div style={{ flex: '0 0 25%' }}>
          <PieRenaksi data={renaksiPie} loading={loading} onSliceClick={handlePieClick} />
        </div>
        <div style={{ flex: '0 0 25%' }}>
          <PieStatus
            onTrack={scorecards?.on_track ?? 0}
            warning={scorecards?.warning ?? 0}
            alert={scorecards?.alert ?? 0}
            belumDiisi={(scorecards?.total_indikator ?? 0) - (scorecards?.on_track ?? 0) - (scorecards?.warning ?? 0) - (scorecards?.alert ?? 0)}
            loading={loading}
            onSliceClick={handlePieStatusClick}
          />
        </div>
      </div>

      {/* ── Lapis 1: Strategic Overview — bertumpuk full width ── */}
      <div data-reveal>
        <BarPerPilar data={perPilar} loading={loading} />
      </div>
      <div data-reveal>
        <BarPerOpd data={perOpd} loading={loading} />
      </div>

      {/* ── Lapis 2: Diagnostic ── */}
      <div className="responsive-row" data-reveal>
        <div style={{ flex: '1 1 40%', minWidth: 0 }}>
          <HeatmapGrid data={heatmapData} loading={loading} />
        </div>
        <div style={{ flex: '1 1 60%', minWidth: 0 }}>
          <SmallMultipleIndikator data={chartPerIndikator} loading={loading} />
        </div>
      </div>



      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} data-reveal>
        <div className="flex items-center gap-2.5">
          <Table2 size={15} style={{ color: 'hsl(var(--ds-muted-foreground))' }} />
          <p className="ds-section-label">
            Tabel Indikator
          </p>
          {!loading && (
            <span className="text-xs ml-1" style={{ color: 'hsl(var(--ds-muted-foreground))', opacity: 0.6 }}>
              — {filteredTableData.length} data
            </span>
          )}
        </div>
        <DataTable data={filteredTableData} loading={loading} onRowClick={handleRowClick} />
      </div>

      <RenaksiModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        kode={modalKode}
        namaIndikator={modalNama}
        data={renaksiData}
        loading={renaksiLoading}
        mode={modalMode}
      />

      <StatusDetailModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={statusModalTitle}
        subtitle={`Indikator dengan status ${statusModalTitle} (Tahun ${tahun || '2025'})`}
        data={statusDetailData}
        loading={statusDetailLoading}
      />

      <IndikatorDetailModal
        open={indikatorDetailOpen}
        onClose={() => setIndikatorDetailOpen(false)}
        kode={indikatorDetailKode}
      />
    </div>
  );
}
