import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Props {
  onMobileMenu: () => void;
}

export default function Header({ onMobileMenu }: Props) {
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
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenu}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Buka menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {mounted && (
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
          title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}
    </header>
  );
}
