import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, FileText, Loader2, FileX, CheckCircle2, XCircle, BarChart3, ListChecks, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { RencanaAksiRow, RencanaAksiSummary, FilterOptions } from '@/types';

// ── Helpers ──────────────────────────────────────────
async function apiFetch<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

// ── Component ────────────────────────────────────────
export default function RencanaAksiPage() {
  // Filters
  const [tahun, setTahun] = useState('');
  const [pilarId, setPilarId] = useState('');
  const [opdId, setOpdId] = useState('');
  const [statusRenaksi, setStatusRenaksi] = useState('');
  const [search, setSearch] = useState('');

  // Data
  const [data, setData] = useState<RencanaAksiRow[]>([]);
  const [summary, setSummary] = useState<RencanaAksiSummary | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);

  // Sort
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal for renaksi detail
  const [selected, setSelected] = useState<RencanaAksiRow | null>(null);

  // ── Fetch ─────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tahun) params.set('tahun', tahun);
      if (pilarId) params.set('pilar_id', pilarId);
      if (opdId) params.set('opd_id', opdId);
      if (statusRenaksi) params.set('status_renaksi', statusRenaksi);
      if (search) params.set('search', search);

      const [list, sum] = await Promise.all([
        apiFetch<RencanaAksiRow[]>(`/api/dashboard/rencana-aksi-list?${params}`),
        apiFetch<RencanaAksiSummary>(`/api/dashboard/rencana-aksi-summary?${params}`),
      ]);
      setData(list);
      setSummary(sum);
    } catch (err) {
      console.error('[PJPK] rencana aksi fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiFetch<FilterOptions>('/api/filters').then(setFilterOptions);
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [tahun, pilarId, opdId, statusRenaksi, search]);

  // ── Sort data ─────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!data.length) return data;
    return [...data].sort((a, b) => {
      const aTahun = parseInt(a.tahun, 10);
      const bTahun = parseInt(b.tahun, 10);
      return sortOrder === 'asc' ? aTahun - bTahun : bTahun - aTahun;
    });
  }, [data, sortOrder]);

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

  const statCard: React.CSSProperties = {
    flex: 1,
    padding: '1.25rem 1.5rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Rencana Aksi</h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          Monitoring pelaksanaan rencana aksi pembangunan kependudukan per pilar & tahun
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '0.75rem' }}>
        <div style={statCard}>
          <div className="flex items-center gap-2">
            <ListChecks size={18} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Total Rencana Aksi</span>
          </div>
          <span className="text-[30px] font-bold leading-none" style={{ color: 'var(--color-text)' }}>
            {summary?.total ?? '-'}
          </span>
        </div>
        <div style={statCard}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Terlaksana</span>
          </div>
          <span className="text-[30px] font-bold leading-none" style={{ color: 'var(--color-success)' }}>
            {summary?.terlaksana ?? '-'}
          </span>
        </div>
        <div style={statCard}>
          <div className="flex items-center gap-2">
            <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Tidak Terlaksana</span>
          </div>
          <span className="text-[30px] font-bold leading-none" style={{ color: 'var(--color-danger)' }}>
            {summary?.tidak_terlaksana ?? '-'}
          </span>
        </div>
        <div style={statCard}>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: 'var(--color-warning)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Persentase Capaian</span>
          </div>
          <span className="text-[30px] font-bold leading-none" style={{ color: 'var(--color-warning)' }}>
            {summary ? `${summary.persentase}%` : '-'}
          </span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-xl border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', padding: '1.5rem' }}>
        <div className="flex items-center gap-2.5" style={{ marginBottom: '1rem' }}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Filter</p>
        </div>
        <div className="filter-full" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
          <select value={tahun} onChange={e => setTahun(e.target.value)} style={{ ...baseSelect, minWidth: 130 }} className="mobile-full">
            <option value="">Semua Tahun</option>
            {filterOptions?.tahun.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={pilarId} onChange={e => setPilarId(e.target.value)} style={{ ...baseSelect, minWidth: 200 }}>
            <option value="">Semua Pilar</option>
            {filterOptions?.pilar.map(p => <option key={p.id} value={p.id}>{p.nama_pilar}</option>)}
          </select>
          <select value={opdId} onChange={e => setOpdId(e.target.value)} style={{ ...baseSelect, minWidth: 160 }}>
            <option value="">Semua OPD</option>
            {filterOptions?.opd.map(o => <option key={o.id} value={o.id}>{o.kode_opd}</option>)}
          </select>
          <select value={statusRenaksi} onChange={e => setStatusRenaksi(e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
            <option value="">Semua Status</option>
            <option value="Terlaksana">Terlaksana</option>
            <option value="Tidak Terlaksana">Tidak Terlaksana</option>
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

      {/* ── Table ── */}
      {loading ? (
        <div className="rounded-xl border flex items-center justify-center py-20"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <FileX size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada rencana aksi yang sesuai filter</p>
        </div>
      ) : (
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
              {sortedData.map((row) => (
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
                      backgroundColor: row.status === 'Terlaksana' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: row.status === 'Terlaksana' ? '#16a34a' : '#dc2626',
                    }}>
                      {row.status}
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
      )}

      {/* Tabel footer */}
      {!loading && data.length > 0 && (
        <p className="text-xs text-right" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
          Menampilkan {sortedData.length} rencana aksi
        </p>
      )}

      {/* ── Detail Modal ── */}
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
                <div className="p-2 rounded-lg" style={{ backgroundColor: selected.status === 'Terlaksana' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                  {selected.status === 'Terlaksana'
                    ? <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                    : <XCircle size={20} style={{ color: '#dc2626' }} />
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
                      backgroundColor: selected.status === 'Terlaksana' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: selected.status === 'Terlaksana' ? '#16a34a' : '#dc2626',
                    }}>
                      {selected.status}
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
