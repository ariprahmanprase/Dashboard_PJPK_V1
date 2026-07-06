import type { FilterOptions, DashboardFilters } from '@/types';

interface Props {
  options: FilterOptions | null;
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
}

export default function FilterBar({ options, filters, onFilterChange }: Props) {
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
      <select value={filters.opd_id || ''} onChange={e => onFilterChange('opd_id', e.target.value)} style={baseSelect}>
        <option value="">Semua OPD</option>
        {options?.opd.map(o => <option key={o.id} value={o.id}>{o.kode_opd}</option>)}
      </select>
      <select value={filters.pilar_id || ''} onChange={e => onFilterChange('pilar_id', e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
        <option value="">Semua Pilar</option>
        {options?.pilar.map(p => <option key={p.id} value={p.id}>Pilar {p.no_pilar}</option>)}
      </select>
      <select value={filters.indikator_id || ''} onChange={e => onFilterChange('indikator_id', e.target.value)} style={{ ...baseSelect, minWidth: 280 }}>
        <option value="">Semua Indikator</option>
        {options?.indikator.map(i => <option key={i.id} value={i.id}>{i.kode} — {i.nama_indikator}</option>)}
      </select>
      <select value={filters.tahun || '2025'} onChange={e => onFilterChange('tahun', e.target.value)} style={{ ...baseSelect, minWidth: 110 }}>
        {options?.tahun.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filters.status_tl || ''} onChange={e => onFilterChange('status_tl', e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
        <option value="">Semua Status</option>
        {options?.status_tl.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
