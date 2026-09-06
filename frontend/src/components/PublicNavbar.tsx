import { useEffect, useState } from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { getToken, getStoredUser } from '@/services/admin';
import type { PageName } from './Sidebar';

interface Props {
  activePage: PageName;
  onNavigate: (page: PageName) => void;
}

/**
 * Navbar atas (floating glass) untuk halaman publik —
 * menggantikan Sidebar + Header lama. Mengikuti draft UI.
 */
export default function PublicNavbar({ activePage, onNavigate }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loggedIn = Boolean(getToken() && getStoredUser());

  useEffect(() => setMounted(true), []);

  const go = (p: PageName) => {
    onNavigate(p);
    setMobileOpen(false);
  };

  const dark = mounted && resolvedTheme === 'dark';

  return (
    <header className="ds-navbar">
      <div className="ds-navbar-inner">
        {/* Brand */}
        <button
          onClick={() => go('report')}
          className="flex items-center gap-2.5 shrink-0"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--ds-foreground))', whiteSpace: 'nowrap' }}
        >
          <img
            src="/logo-sidoarjo.webp"
            alt="Logo Kabupaten Sidoarjo"
            className="ds-brand-logo"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span>
            Dashboard PJPK
            <span style={{ display: 'block', fontSize: '0.625rem', fontWeight: 500, color: 'hsl(var(--ds-muted-foreground))', lineHeight: 1.2 }}>
              Kabupaten Sidoarjo
            </span>
          </span>
        </button>

        {/* Menu tengah (pill) */}
        <nav className={`ds-nav-links ${mobileOpen ? 'open' : ''}`}>
          <button className={`ds-nav-link ${activePage === 'report' ? 'active' : ''}`} onClick={() => go('report')}>
            Indikator
          </button>
          <button className={`ds-nav-link ${activePage === 'rencana-aksi' ? 'active' : ''}`} onClick={() => go('rencana-aksi')}>
            Rencana Aksi
          </button>
          <button className={`ds-nav-link ${activePage === 'rank' ? 'active' : ''}`} onClick={() => go('rank')}>
            Rank
          </button>
        </nav>

        {/* Aksi kanan */}
        <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
          {mounted && (
            <button
              onClick={() => setTheme(dark ? 'light' : 'dark')}
              title={dark ? 'Light mode' : 'Dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'hsl(var(--ds-muted-foreground))',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
          <a
            href="/admin"
            style={{
              display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 1rem',
              borderRadius: 999, background: 'hsl(var(--ds-primary))', color: 'hsl(var(--ds-primary-foreground))',
              fontSize: '0.813rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgb(0 0 0 / 0.08)',
            }}
          >
            {loggedIn ? 'Dashboard' : 'Login'}
          </a>
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
            className="ds-nav-toggle"
            style={{
              display: 'none', width: 36, height: 36, borderRadius: 999, cursor: 'pointer',
              border: '1px solid hsl(var(--ds-border))', background: 'hsl(var(--ds-card) / 0.7)',
              color: 'hsl(var(--ds-foreground))', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Menu size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
