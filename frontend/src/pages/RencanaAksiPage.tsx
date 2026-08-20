import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, FileText, Loader2, FileX, Table2, Grid, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import ScoreCard from '@/components/ScoreCard';
import type { RenaksiProgramRow, RenaksiProgramSummary, FilterOptions, RencanaAksiRow, RencanaAksiSummary, IndikatorOption } from '@/types';
import RenaksiProgramTable from '@/components/RenaksiProgramTable';
import { renaksiStatusStyle } from '@/lib/renaksiStatus';

// ── Helpers ──────────────────────────────────────────
async function apiFetch<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

// ── Component ────────────────────────────────────────
export default function RencanaAksiPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'program' | 'indikator'>('program');

  // Filters
  const [tahun, setTahun] = useState('');
  const [pilarId, setPilarId] = useState('');
  const [opdId, setOpdId] = useState('');
  const [dinas, setDinas] = useState('');
  const [indikatorId, setIndikatorId] = useState('');
  const [statusRenaksi, setStatusRenaksi] = useState('');
  const [search, setSearch] = useState('');

  // Data Program (Excel)
  const [programData, setProgramData] = useState<RenaksiProgramRow[]>([]);
  const [programSummary, setProgramSummary] = useState<RenaksiProgramSummary | null>(null);

  // Data Indikator (Lama)
  const [indikatorData, setIndikatorData] = useState<RencanaAksiRow[]>([]);
  const [indikatorSummary, setIndikatorSummary] = useState<RencanaAksiSummary | null>(null);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [dinasList, setDinasList] = useState<string[]>([]);
  const [programIndikatorList, setProgramIndikatorList] = useState<IndikatorOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Sort for indikator table
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal for detail
  const [selected, setSelected] = useState<RencanaAksiRow | null>(null);

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
      if (indikatorId) progParams.set('indikator_id', indikatorId);
      if (statusRenaksi) progParams.set('status_renaksi', statusRenaksi);
      if (search) progParams.set('search', search);

      // Build params for indikator - use OPD filter
      const indParams = new URLSearchParams();
      if (opdId) indParams.set('opd_id', opdId);
      if (indikatorId) indParams.set('indikator_id', indikatorId);
      if (statusRenaksi) indParams.set('status_renaksi', statusRenaksi);
      if (search) indParams.set('search', search);
      if (tahun) indParams.set('tahun', tahun);
      if (pilarId) indParams.set('pilar_id', pilarId);

      // Fetch both datasets in parallel
      const [progList, progSum, indList, indSum] = await Promise.all([
        apiFetch<RenaksiProgramRow[]>(`/api/dashboard/renaksi-program-list?${progParams}`),
        apiFetch<RenaksiProgramSummary>(`/api/dashboard/renaksi-program-summary?dinas=${encodeURIComponent(dinas)}${tahun ? `&tahun=${tahun}` : ''}`),
        apiFetch<RencanaAksiRow[]>(`/api/dashboard/rencana-aksi-list?${indParams}`),
        apiFetch<RencanaAksiSummary>(`/api/dashboard/rencana-aksi-summary?${tahun ? `tahun=${tahun}` : ''}${pilarId ? `&pilar_id=${pilarId}` : ''}`),
      ]);

      setProgramData(progList);
      setProgramSummary(progSum);
      setIndikatorData(indList);
      setIndikatorSummary(indSum);
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
  }, [tahun, pilarId, opdId, dinas, indikatorId, statusRenaksi, search]);

  // ── Sort data (indikator) ─────────────────────────────────────
  const sortedIndikatorData = useMemo(() => {
    if (!indikatorData.length) return indikatorData;
    return [...indikatorData].sort((a, b) => {
      const aTahun = parseInt(a.tahun, 10);
      const bTahun = parseInt(b.tahun, 10);
      return sortOrder === 'asc' ? aTahun - bTahun : bTahun - aTahun;
    });
  }, [indikatorData, sortOrder]);

  // ── Styles ────────────────────────────────────────
  const baseSelect: React.CSSProperties = {
    height: 40,
    padding: '0 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    outline: 'none',
    minWidth: 160,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Rencana Aksi</h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          Monitoring pelaksanaan rencana aksi pembangunan kependudukan
        </p>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('program')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'program' ? 'shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          style={{
            backgroundColor: activeTab === 'program' ? 'var(--color-bg-primary)' : 'transparent',
            color: activeTab === 'program' ? 'var(--color-text)' : 'var(--color-text-secondary)',
          }}
        >
          <Table2 size={16} />
          Program
        </button>
        <button
          onClick={() => setActiveTab('indikator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'indikator' ? 'shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          style={{
            backgroundColor: activeTab === 'indikator' ? 'var(--color-bg-primary)' : 'transparent',
            color: activeTab === 'indikator' ? 'var(--color-text)' : 'var(--color-text-secondary)',
          }}
        >
          <Grid size={16} />
          Per Indikator
        </button>
      </div>

      {/* ── Summary Cards (based on active tab) ── */}
      {loading && !programSummary && !indikatorSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5" style={{ gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-5 animate-pulse"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-2.5" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-14" />
            </div>
          ))}
        </div>
      ) : activeTab === 'program' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5" style={{ gap: '0.75rem' }}>
          <ScoreCard label="Total Program" value={programSummary?.total ?? 0} variant="info" />
          <ScoreCard label="Total Dinas" value={programSummary?.total_dinas ?? 0} variant="info" />
          <ScoreCard label="Tercapai" value={programSummary?.tercapai ?? 0} variant="success" />
          <ScoreCard label="Hampir Tercapai" value={programSummary?.hampir_tercapai ?? 0} variant="warning" />
          <ScoreCard label="Tidak Tercapai" value={programSummary?.tidak_tercapai ?? 0} variant="danger" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4" style={{ gap: '0.75rem' }}>
          <ScoreCard label="Total Rencana Aksi" value={indikatorSummary?.total ?? 0} variant="info" />
          <ScoreCard label="Terlaksana" value={indikatorSummary?.terlaksana ?? 0} variant="success" />
          <ScoreCard label="Tidak Terlaksana" value={indikatorSummary?.tidak_terlaksana ?? 0} variant="danger" />
          <ScoreCard label="Persentase" value={indikatorSummary ? `${indikatorSummary.persentase}%` : '0%'} variant="warning" />
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1.5rem' }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: '1rem' }}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Filter</p>
        </div>
        <div className="filter-full" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
          {/* Tahun - show for both tabs */}
          <select value={tahun} onChange={e => setTahun(e.target.value)} style={{ ...baseSelect, minWidth: 130 }} className="mobile-full">
            <option value="">Semua Tahun</option>
            {['2025', '2026', '2027', '2028', '2029'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Pilar - only show for Indikator tab */}
          {activeTab === 'indikator' && (
            <select value={pilarId} onChange={e => setPilarId(e.target.value)} style={{ ...baseSelect, minWidth: 200 }}>
              <option value="">Semua Pilar</option>
              {filterOptions?.pilar.map(p => <option key={p.id} value={p.id}>{p.nama_pilar}</option>)}
            </select>
          )}

          {/* OPD - only show for Indikator tab */}
          {activeTab === 'indikator' && (
            <select value={opdId} onChange={e => setOpdId(e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
              <option value="">Semua OPD</option>
              {filterOptions?.opd.map(o => <option key={o.id} value={o.id}>{o.kode_opd}</option>)}
            </select>
          )}

          {/* Dinas - only show for Program tab */}
          {activeTab === 'program' && (
            <select value={dinas} onChange={e => setDinas(e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
              <option value="">Semua Dinas</option>
              {dinasList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          {/* Indikator - show for both tabs; tab Program hanya indikator yang dipakai di rencana aksi */}
          <select value={indikatorId} onChange={e => setIndikatorId(e.target.value)} style={{ ...baseSelect, minWidth: 220 }}>
            <option value="">Semua Indikator</option>
            {(activeTab === 'program' ? programIndikatorList : filterOptions?.indikator ?? []).map(i => (
              <option key={i.id} value={i.id}>{i.nama_indikator.length > 50 ? i.nama_indikator.slice(0, 50) + '…' : i.nama_indikator}</option>
            ))}
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
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-secondary)' }} />
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
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Table (based on active tab) ── */}
      {activeTab === 'program' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="flex items-center gap-2.5">
            <Table2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Tabel Program Rencana Aksi
            </p>
            {!loading && (
              <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                — {programData.length} data
              </span>
            )}
          </div>
          <RenaksiProgramTable data={programData} loading={loading} />
        </div>
      ) : (
        <>
          {/* Indikator Table */}
          {loading ? (
            <div className="rounded-xl border flex items-center justify-center py-20"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          ) : sortedIndikatorData.length === 0 ? (
            <div className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
              <FileX size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada rencana aksi yang sesuai filter</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex items-center gap-2.5">
                <Table2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Tabel Rencana Aksi per Indikator
                </p>
                <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                  — {sortedIndikatorData.length} data
                </span>
              </div>
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: 900 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>No</th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>Kode</th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>Indikator</th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>Pilar</th>
                        <th
                          className="text-left font-medium uppercase tracking-wider select-none"
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                          Tahun{' '}
                          {sortOrder === 'asc'
                            ? <ArrowUp size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                            : <ArrowDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                          }
                        </th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>Rencana Aksi</th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>OPD</th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>Status</th>
                        <th className="text-left font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)', fontSize: '0.688rem', padding: '0.875rem 1.25rem' }}>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIndikatorData.map((row) => (
                        <tr key={row.id}
                          style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          onClick={() => setSelected(row)}
                        >
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}>{row.no}</td>
                          <td className="font-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}>{row.kode}</td>
                          <td className="font-medium truncate" style={{ color: 'var(--color-text)', padding: '0.75rem 1.25rem', maxWidth: 240 }}>{row.indikator}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}>{row.pilar}</td>
                          <td className="font-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}>{row.tahun}</td>
                          <td className="truncate" style={{ color: 'var(--color-text)', padding: '0.75rem 1.25rem', maxWidth: 300 }}>{row.rencana_aksi}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem' }}>{row.opd}</td>
                          <td style={{ padding: '0.75rem 1.25rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.625rem',
                              borderRadius: '100px',
                              fontSize: '0.688rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              backgroundColor: renaksiStatusStyle(row.status).bg,
                              color: renaksiStatusStyle(row.status).color,
                            }}>
                              {renaksiStatusStyle(row.status).label}
                            </span>
                          </td>
                          <td className="truncate" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', padding: '0.75rem 1.25rem', maxWidth: 200 }}>
                            {row.catatan ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabel footer */}
      {!loading && (
        <p className="text-xs text-right" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
          Menampilkan {activeTab === 'program' ? programData.length : sortedIndikatorData.length} rencana aksi
        </p>
      )}

      {/* ── Detail Modal (Indikator) ── */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-2xl shadow-2xl"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '2rem',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: renaksiStatusStyle(selected.status).bg }}>
                  {selected.status === 'Tidak Tercapai'
                    ? <XCircle size={20} style={{ color: renaksiStatusStyle(selected.status).color }} />
                    : <CheckCircle2 size={20} style={{ color: renaksiStatusStyle(selected.status).color }} />
                  }
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.kode} — {selected.pilar}
                  </p>
                  <p className="text-base font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                    {selected.indikator}
                  </p>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--color-border)' }} />

              {/* Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rencana Aksi</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{selected.rencana_aksi}</p>
                </div>

                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tahun</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{selected.tahun}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status</p>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '100px',
                      fontSize: '0.688rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      backgroundColor: renaksiStatusStyle(selected.status).bg,
                      color: renaksiStatusStyle(selected.status).color,
                    }}>
                      {renaksiStatusStyle(selected.status).label}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>OPD Penanggung Jawab</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{selected.opd}</p>
                </div>

                {selected.kolaborasi && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>OPD Kolaborasi</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{selected.kolaborasi}</p>
                  </div>
                )}

                {selected.catatan && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Catatan</p>
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>{selected.catatan}</p>
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="mt-2 p-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
