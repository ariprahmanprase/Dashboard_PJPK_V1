import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { opdInduk } from '@/lib/opd';

interface OpdLike {
  id: number | string;
  nama_opd?: string;
  kode_opd?: string;
}

interface Props {
  options: OpdLike[];
  /** value = id OPD terpilih ('' = belum pilih / semua) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** label utk opsi kosong; kalau undefined, opsi kosong tidak ditampilkan */
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Dropdown OPD dengan fitur search (tampilan label dinormalisasi ke dinas induk).
 * Label duplikat (mis. 3 bidang Dinkopum) tetap dibedakan dengan suffix bidang.
 */
export default function OpdSearchSelect({
  options,
  value,
  onChange,
  placeholder = '— Pilih OPD —',
  emptyLabel,
  disabled,
  required,
  className,
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  // Label: induk; kalau ada label ganda, tampilkan nama asli agar bisa dibedakan
  const items = useMemo(() => {
    const rows = options.map(o => {
      const asli = o.nama_opd ?? o.kode_opd ?? '';
      return { id: String(o.id), asli, induk: opdInduk(asli) };
    });
    const counts = new Map<string, number>();
    rows.forEach(r => counts.set(r.induk, (counts.get(r.induk) ?? 0) + 1));
    return rows.map(r => ({
      ...r,
      label: (counts.get(r.induk) ?? 0) > 1 && r.asli !== r.induk ? `${r.induk} — ${r.asli}` : r.induk,
    }));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find(i => i.id === value);

  return (
    <div ref={ref} className={className} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="rounded-lg border px-4 py-3 text-sm w-full flex items-center justify-between gap-2"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: disabled ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
          color: selected ? 'var(--color-text)' : 'var(--color-text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
        }}
      >
        <span className="truncate">
          {selected ? selected.label : (value === '' && emptyLabel ? emptyLabel : placeholder)}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value !== '' && !disabled && !required && (
            <X
              size={14}
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={e => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronDown size={15} style={{ color: 'var(--color-text-secondary)' }} />
        </span>
      </button>

      {/* input tersembunyi untuk validasi `required` pada form */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
        />
      )}

      {open && (
        <div
          className="rounded-xl border shadow-xl"
          style={{
            position: 'absolute',
            zIndex: 80,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: 220,
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }}
            />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari OPD…"
              className="w-full text-sm rounded-lg border"
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {emptyLabel !== undefined && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                Tidak ditemukan
              </p>
            ) : (
              filtered.map(i => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => { onChange(i.id); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  style={{
                    color: 'var(--color-text)',
                    backgroundColor: i.id === value ? 'rgba(59,130,246,0.1)' : 'transparent',
                    fontWeight: i.id === value ? 600 : 400,
                  }}
                >
                  {i.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
