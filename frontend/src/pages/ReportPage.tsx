import { useState, useEffect, useMemo } from 'react';
import { Filter, Table2 } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import ScoreCardGrid from '@/components/ScoreCardGrid';
import type { ScorecardKey } from '@/components/ScoreCardGrid';
import DataTable from '@/components/DataTable';
import RenaksiModal from '@/components/RenaksiModal';
import ChartCombo from '@/components/ChartCombo';
import PieRenaksi from '@/components/PieRenaksi';
import PieStatus from '@/components/PieStatus';
import BarPerPilar from '@/components/BarPerPilar';
import BarPerOpd from '@/components/BarPerOpd';
import SmallMultiple from '@/components/SmallMultiple';
import HeatmapGrid from '@/components/HeatmapGrid';
import GapRanking from '@/components/GapRanking';
import type { Scorecards, TableRow, FilterOptions, RenaksiItem, ChartDataPoint, RenaksiPieData, RenaksiListItem, PerPilarItem, PerOpdItem, HeatmapRow, ChartPilarEntry } from '@/types';

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
  // Filter states
  const [tahun, setTahun] = useState('2025');
  const [opdId, setOpdId] = useState('');
  const [pilarId, setPilarId] = useState('');
  const [indikatorId, setIndikatorId] = useState('');
  const [statusTl, setStatusTl] = useState('');
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

  // Chart states
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [renaksiPie, setRenaksiPie] = useState<RenaksiPieData | null>(null);
  const [perPilar, setPerPilar] = useState<PerPilarItem[]>([]);
  const [perOpd, setPerOpd] = useState<PerOpdItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapRow[]>([]);
  const [chartPerPilar, setChartPerPilar] = useState<ChartPilarEntry[]>([]);

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

      const [sc, tbl, ch, rp, pp, po, hm, cpp] = await Promise.all([
        apiFetch<Scorecards>(`/api/dashboard/scorecards?${params}`),
        apiFetch<TableRow[]>(`/api/dashboard/table?${params}`),
        apiFetch<ChartDataPoint[]>(`/api/dashboard/chart?${params}`),
        apiFetch<RenaksiPieData>(`/api/dashboard/renaksi-pie?${params}`),
        apiFetch<PerPilarItem[]>(`/api/dashboard/per-pilar?${params}`),
        apiFetch<PerOpdItem[]>(`/api/dashboard/per-opd?${params}`),
        apiFetch<HeatmapRow[]>(`/api/dashboard/heatmap?${hmParams}`),
        apiFetch<ChartPilarEntry[]>(`/api/dashboard/chart-per-pilar?${params}`),
      ]);
      setScorecards(sc);
      setTableData(tbl);
      setChartData(ch);
      setRenaksiPie(rp);
      setPerPilar(pp);
      setPerOpd(po);
      setHeatmapData(hm);
      setChartPerPilar(cpp);
    } catch (err) {
      console.error('[PJPK] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Initial mount ─────────────────────────────────
  useEffect(() => {
    apiFetch<FilterOptions>('/api/filters').then(setFilterOptions);
    fetchDataFor({ tahun: '2025', opdId: '', pilarId: '', indikatorId: '', statusTl: '' });
  }, []);

  // ── Scorecard click ───────────────────────────────
  function handleScorecardClick(key: ScorecardKey) {
    if (scorecardKey === key) {
      // Deselect
      setScorecardKey(null);
      setStatusTl('');
      setTahun('2025');
      setOpdId('');
      setPilarId('');
      setIndikatorId('');
      fetchDataFor({ tahun: '2025', opdId: '', pilarId: '', indikatorId: '', statusTl: '' });
      return;
    }

    setScorecardKey(key);
    setOpdId('');
    setPilarId('');
    setIndikatorId('');

    let newStatus = '';
    if (key === 'on_track') newStatus = 'On Track';
    else if (key === 'warning') newStatus = 'Warning';
    else if (key === 'alert') newStatus = 'Alert';

    setStatusTl(newStatus);
    setTahun('2025');
    fetchDataFor({ tahun: '2025', opdId: '', pilarId: '', indikatorId: '', statusTl: newStatus });
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

    if (_key === 'tahun') setTahun(value);
    else if (_key === 'opd_id') setOpdId(value);
    else if (_key === 'pilar_id') setPilarId(value);
    else if (_key === 'indikator_id') setIndikatorId(value);
    else if (_key === 'status_tl') setStatusTl(value);

    fetchDataFor(newState);
  }

  // ── Rencana Aksi modal handler ────────────────────
  async function handleRowClick(row: TableRow) {
    setModalMode('indikator');
    setModalKode(row.kode);
    setModalNama(row.nama_indikator);
    setModalOpen(true);
    setRenaksiLoading(true);
    setRenaksiData([]);

    try {
      const resp = await fetch(`/api/indikator/${row.kode}/renaksi`);
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const json = await resp.json();
      setRenaksiData(json.renaksi ?? []);
    } catch (err) {
      console.error('[PJPK] renaksi fetch error:', err);
    } finally {
      setRenaksiLoading(false);
    }
  }

  async function handlePieClick(status: string) {
    const params = buildParams({ tahun, opdId, pilarId, indikatorId, statusTl });
    const statusParam = status.replace(' ', '+');
    setModalMode('all');
    setModalKode(`Menampilkan rencana aksi dengan status: ${status} (filter aktif)`);
    setModalNama('');
    setModalOpen(true);
    setRenaksiLoading(true);
    setRenaksiData([]);

    try {
      const resp = await fetch(`/api/dashboard/renaksi-list?${params}&status_renaksi=${statusParam}`);
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const json = await resp.json();
      // Cast RenaksiListItem[] → RenaksiItem[] (extra indikator field handled in modal)
      setRenaksiData(json as RenaksiItem[]);
    } catch (err) {
      console.error('[PJPK] renaksi list fetch error:', err);
    } finally {
      setRenaksiLoading(false);
    }
  }

  // ── Client-side filter ────────────────────────────
  const filteredTableData = useMemo(() => {
    if (scorecardKey === 'target_belum') return tableData.filter(r => r.target === null);
    if (scorecardKey === 'capaian_belum') return tableData.filter(r => r.capaian === null);
    return tableData;
  }, [tableData, scorecardKey]);

  const filtersObj = { tahun, opd_id: opdId, pilar_id: pilarId, indikator_id: indikatorId, status_tl: statusTl };

  return (
    <div className="max-w-[1440px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Report</h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          Monitoring 30 indikator pembangunan kependudukan Kabupaten Sidoarjo
        </p>
      </div>

      <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '2rem' }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: '1.25rem' }}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Filter Data</p>
        </div>
        <FilterBar options={filterOptions} filters={filtersObj} onFilterChange={handleFilterChange} />
      </div>

      <ScoreCardGrid data={scorecards} loading={loading} activeKey={scorecardKey} onCardClick={handleScorecardClick} />

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: '0 0 50%' }}>
          <ChartCombo data={chartData} loading={loading} />
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
          />
        </div>
      </div>

      {/* ── Lapis 1: Strategic Overview ── */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <BarPerPilar data={perPilar} loading={loading} />
        </div>
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <BarPerOpd data={perOpd} loading={loading} />
        </div>
      </div>

      {/* ── Lapis 2: Diagnostic ── */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: '1 1 60%', minWidth: 0 }}>
          <SmallMultiple data={chartPerPilar} loading={loading} />
        </div>
        <div style={{ flex: '1 1 40%', minWidth: 0 }}>
          <HeatmapGrid data={heatmapData} loading={loading} />
        </div>
      </div>

      {/* ── Gap Ranking ── */}
      <GapRanking data={tableData} loading={loading} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex items-center gap-2.5">
          <Table2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            Tabel Indikator
          </p>
          {!loading && (
            <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
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
    </div>
  );
}
