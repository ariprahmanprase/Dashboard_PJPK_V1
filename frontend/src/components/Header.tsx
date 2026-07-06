import { PanelLeftClose, PanelLeftOpen, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Header({ collapsed, onToggle }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header
      className="flex items-center justify-between shrink-0 border-b"
      style={{
        height: 64,
        padding: '0 1.5rem',
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <img
          src="/sidoarjoo.png"
          alt="Logo Sidoarjo"
          className="w-8 h-8 object-contain"
        />

        <div>
          <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
            DASHBOARD PJPK
          </h1>
          <p className="text-[11px] font-medium leading-tight mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            KABUPATEN SIDOARJO
          </p>
        </div>
      </div>

      {mounted && (
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}
    </header>
  );
}
