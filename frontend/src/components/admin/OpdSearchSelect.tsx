import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

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
  /** Tema warna: 'admin' (var --color-*) atau 'ds' (hsl --ds-* halaman publik). Default 'admin'. */
  theme?: 'admin' | 'ds';
  /** Lebar minimal panel dropdown (px). Default 220. */
  minPanelWidth?: number;
  /** Style tombol pemicu — samakan dengan select lain di halaman (tinggi, padding, font, dll). */
  buttonStyle?: React.CSSProperties;
}

/**
 * Dropdown OPD dengan fitur search — label nama asli lengkap dari DB.
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
  theme = 'admin',
  minPanelWidth = 220,
  buttonStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Posisi panel (fixed) — panel dirender via portal ke body agar tidak
  // terpotong/tertutup stacking context animasi reveal halaman publik
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Tutup dropdown saat klik di luar — panel ada di portal (bukan anak ref),
  // jadi klik di dalam panel harus dikecualikan agar tidak langsung menutup
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const update = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setPanelPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    setTimeout(() => searchRef.current?.focus(), 0);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Label: nama asli lengkap dari DB (tidak dinormalisasi/disingkat)
  const items = useMemo(() => {
    return options
      .map(o => ({ id: String(o.id), label: o.nama_opd ?? o.kode_opd ?? '' }))
      .filter(o => o.label !== '')
      .sort((a, b) => a.label.localeCompare(b.label, 'id'));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find(i => i.id === value);

  // Palet warna per tema (halaman admin memakai --color-*, publik memakai --ds-*)
  const c = theme === 'ds'
    ? {
        border: 'hsl(var(--ds-border))',
        bg: 'hsl(var(--ds-card))',
        bgDisabled: 'hsl(var(--ds-muted))',
        text: 'hsl(var(--ds-foreground))',
        textSecondary: 'hsl(var(--ds-muted-foreground))',
        hover: 'hsl(var(--ds-muted))',
        active: 'hsl(var(--ds-primary) / 0.12)',
      }
    : {
        border: 'var(--color-border)',
        bg: 'var(--color-bg-secondary)',
        bgDisabled: 'var(--color-bg-tertiary)',
        text: 'var(--color-text)',
        textSecondary: 'var(--color-text-secondary)',
        hover: 'var(--color-bg-tertiary)',
        active: 'rgba(59,130,246,0.12)',
      };

  return (
    <div ref={ref} className={className} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2"
        style={{
          // Default mengikuti form admin; halaman lain mengirim buttonStyle
          // agar tampil persis seperti <select> aslinya
          borderRadius: '0.5rem',
          border: `1px solid ${c.border}`,
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          ...buttonStyle,
          backgroundColor: disabled ? c.bgDisabled : (buttonStyle?.backgroundColor ?? c.bg),
          color: selected ? c.text : c.textSecondary,
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
              style={{ color: c.textSecondary }}
              onClick={e => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronDown size={15} style={{ color: c.textSecondary }} />
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

      {open && createPortal(
        <div
          ref={panelRef}
          className="rounded-xl border shadow-xl"
          style={{
            position: 'fixed',
            zIndex: 9999,
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            minWidth: minPanelWidth,
            backgroundColor: c.bg,
            borderColor: c.border,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', padding: '0.5rem', borderBottom: `1px solid ${c.border}` }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: c.textSecondary, pointerEvents: 'none' }}
            />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari OPD…"
              className="w-full text-sm rounded-lg border"
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                borderColor: c.border,
                backgroundColor: theme === 'ds' ? 'hsl(var(--ds-background))' : 'var(--color-bg-primary)',
                color: c.text,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {emptyLabel !== undefined && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: c.textSecondary, fontStyle: 'italic', backgroundColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c.hover)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: c.textSecondary }}>
                Tidak ditemukan
              </p>
            ) : (
              filtered.map(i => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => { onChange(i.id); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color: c.text,
                    backgroundColor: i.id === value ? c.active : 'transparent',
                    fontWeight: i.id === value ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    if (i.id !== value) e.currentTarget.style.backgroundColor = c.hover;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = i.id === value ? c.active : 'transparent';
                  }}
                >
                  {i.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
