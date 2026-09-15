import type { FilterOptions, DashboardFilters } from '@/types';
import { RotateCcw } from 'lucide-react';
import { groupOpdOptions } from '@/lib/opd';

interface Props {
  options: FilterOptions | null;
  filters: DashboardFilters;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onReset?: () => void;
}

export default function FilterBar({ options, filters, onFilterChange, onReset }: Props) {
  const hasActiveFilter = Boolean(
    filters.opd_id || filters.pilar_id || filters.indikator_id || filters.status_tl || (filters.tahun && filters.tahun !== '2025')
  );

  const indikatorOptions = filters.pilar_id
    ? options?.indikator.filter(i => String(i.pilar_id) === filters.pilar_id)
    : options?.indikator;

  const baseSelect: React.CSSProperties = {
    height: 38,
    padding: '0 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid hsl(var(--ds-input))',
    backgroundColor: 'hsl(var(--ds-card))',
    color: 'hsl(var(--ds-foreground))',
    fontSize: '0.813rem',
    cursor: 'pointer',
    outline: 'none',
    minWidth: 160,
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
      <select value={filters.tahun || '2025'} onChange={e => onFilterChange('tahun', e.target.value)} style={{ ...baseSelect, minWidth: 110 }}>
        {options?.tahun.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filters.pilar_id || ''} onChange={e => onFilterChange('pilar_id', e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
        <option value="">Semua Pilar</option>
        {options?.pilar.map(p => <option key={p.id} value={p.id}>{p.nama_pilar}</option>)}
      </select>
      <select value={filters.indikator_id || ''} onChange={e => onFilterChange('indikator_id', e.target.value)} style={{ ...baseSelect, minWidth: 280 }}>
        <option value="">Semua Indikator</option>
        {indikatorOptions?.map(i => (
          <option key={i.id} value={i.id} title={i.nama_indikator}>
            {i.nama_indikator.length > 50 ? i.nama_indikator.slice(0, 50) + '…' : i.nama_indikator}
          </option>
        ))}
      </select>
      <select value={filters.opd_id || ''} onChange={e => onFilterChange('opd_id', e.target.value)} style={baseSelect}>
        <option value="">Semua OPD yang mengampu</option>
        {groupOpdOptions(options?.opd ?? [], true).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={filters.status_tl || ''} onChange={e => onFilterChange('status_tl', e.target.value)} style={{ ...baseSelect, minWidth: 180 }}>
        <option value="">Semua Status</option>
        {options?.status_tl.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilter}
          title="Reset semua filter"
          style={{
            height: 38,
            padding: '0 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid hsl(var(--ds-border))',
            backgroundColor: hasActiveFilter ? 'hsl(var(--ds-card))' : 'transparent',
            color: 'hsl(var(--ds-muted-foreground))',
            fontSize: '0.813rem',
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
      )}
    </div>
  );
}
