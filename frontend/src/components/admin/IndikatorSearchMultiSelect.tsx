import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

export interface IndikatorOption {
  id: number;
  kode?: string | null;
  nama_indikator: string;
}

interface Props {
  options: IndikatorOption[];
  /** id indikator terpilih (maks. `max`) */
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Batas maksimal pilihan — setelah tercapai, opsi lain di-disable. Default 4. */
  max?: number;
}

/**
 * Pemilih multi indikator dengan pencarian — meniru pola OpdSearchSelect
 * (tombol pemicu + panel portal berisi kolom cari), tapi multi-pilih:
 * pilihan tampil sebagai chip yang bisa dihapus, dan opsi otomatis
 * ter-disable begitu batas maksimal tercapai.
 */
export default function IndikatorSearchMultiSelect({
  options,
  value,
  onChange,
  placeholder = '— Pilih indikator —',
  disabled,
  max = 4,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Tutup panel saat klik di luar (panel ada di portal, bukan anak ref)
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

  const items = useMemo(
    () =>
      options
        .map((o) => ({
          id: o.id,
          label: `${o.kode ? `${o.kode} — ` : ''}${o.nama_indikator}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'id')),
    [options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const selectedItems = useMemo(
    () => value.map((id) => items.find((i) => i.id === id)).filter((i): i is { id: number; label: string } => !!i),
    [value, items],
  );

  const penuh = value.length >= max;

  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (!penuh) {
      onChange([...value, id]);
    }
  };

  // Tema admin (var --color-*) — mengikuti form Admin Renaksi
  const c = {
    border: 'var(--color-border)',
    bg: 'var(--color-bg-secondary)',
    bgDisabled: 'var(--color-bg-tertiary)',
    text: 'var(--color-text)',
    textSecondary: 'var(--color-text-secondary)',
    hover: 'var(--color-bg-tertiary)',
    active: 'rgba(59,130,246,0.12)',
    chipBg: 'var(--color-bg-tertiary)',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="w-full flex items-center justify-between gap-2"
        style={{
          borderRadius: '0.5rem',
          border: `1px solid ${c.border}`,
          padding: selectedItems.length > 0 ? '0.5rem 1rem' : '0.75rem 1rem',
          fontSize: '0.875rem',
          backgroundColor: disabled ? c.bgDisabled : c.bg,
          color: c.text,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          minHeight: '2.875rem',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = c.border;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span className="flex flex-wrap items-center gap-1.5 min-w-0">
          {selectedItems.length === 0 ? (
            <span style={{ color: c.textSecondary }}>{placeholder}</span>
          ) : (
            selectedItems.map((i) => (
              <span
                key={i.id}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                style={{
                  backgroundColor: c.chipBg,
                  color: c.text,
                  maxWidth: '100%',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = c.chipBg;
                }}
              >
                <span className="truncate" style={{ maxWidth: '26rem' }}>{i.label}</span>
                {!disabled && (
                  <X
                    size={12}
                    style={{ color: c.textSecondary, cursor: 'pointer', flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(i.id);
                    }}
                  />
                )}
              </span>
            ))
          )}
        </span>
        <ChevronDown size={15} style={{ color: c.textSecondary, flexShrink: 0 }} />
      </div>

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
            minWidth: 220,
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari indikator…"
              className="w-full text-sm rounded-lg border"
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                borderColor: c.border,
                backgroundColor: 'var(--color-bg-primary)',
                color: c.text,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: c.textSecondary }}>
                Tidak ditemukan
              </p>
            ) : (
              filtered.map((i) => {
                const dipilih = value.includes(i.id);
                const mati = !dipilih && penuh;
                return (
                  <button
                    key={i.id}
                    type="button"
                    disabled={mati}
                    onClick={() => toggle(i.id)}
                    className="w-full text-left px-4 py-2.5 text-sm"
                    style={{
                      position: 'relative',
                      color: mati ? c.textSecondary : c.text,
                      backgroundColor: dipilih ? c.active : 'transparent',
                      fontWeight: dipilih ? 600 : 400,
                      opacity: mati ? 0.5 : 1,
                      cursor: mati ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.15s ease, padding-left 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (mati) return;
                      if (!dipilih) {
                        e.currentTarget.style.backgroundColor = c.hover;
                        e.currentTarget.style.paddingLeft = '1.5rem';
                        e.currentTarget.style.boxShadow = `inset 3px 0 0 0 var(--color-primary)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = dipilih ? c.active : 'transparent';
                      e.currentTarget.style.paddingLeft = '1rem';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {i.label}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
