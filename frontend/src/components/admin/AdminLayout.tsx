import { useEffect, useState } from 'react';
import {
  ClipboardList,
  ExternalLink,
  FileText,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import type { AdminUser } from '@/services/admin';

export type AdminPageName = 'report' | 'renaksi' | 'users';

interface AdminMenuItem {
  key: AdminPageName;
  label: string;
  icon: typeof ClipboardList;
}

interface Props {
  user: AdminUser;
  activePage: AdminPageName;
  onNavigate: (page: AdminPageName) => void;
  onLogout: () => void;
  /** Judul konten di header (per halaman) */
  title: string;
  /** Subjudul konten di header */
  subtitle?: string;
  children: React.ReactNode;
}

const MENUS: AdminMenuItem[] = [
  { key: 'renaksi', label: 'Admin Renaksi', icon: ClipboardList },
];

// Menu khusus admin analis: report saja (tanpa kelola user)
const ANALIS_MENUS: AdminMenuItem[] = [
  { key: 'report', label: 'Admin Report', icon: FileText },
];

// Menu khusus super admin
const SUPER_MENUS: AdminMenuItem[] = [
  { key: 'report', label: 'Admin Report', icon: FileText },
  { key: 'users', label: 'User', icon: Users },
];

export default function AdminLayout({ user, activePage, onNavigate, onLogout, title, subtitle, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarW = collapsed ? 64 : 256;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Desktop: sidebar fixed */}
      <aside
        className="fixed left-0 top-0 h-full z-50 flex-col transition-all duration-300 ease-in-out border-r hidden lg:flex"
        style={{
          width: sidebarW,
          backgroundColor: 'var(--color-sidebar-bg)',
          borderColor: 'var(--color-sidebar-border)',
        }}
      >
        <AdminSidebarContent
          isExpanded={!collapsed}
          user={user}
          activePage={activePage}
          onNavigate={onNavigate}
          onToggle={() => setCollapsed(!collapsed)}
          onMobileClose={() => setMobileOpen(false)}
          onLogout={onLogout}
        />
      </aside>

      {/* Tablet & mobile: overlay sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className="fixed left-0 top-0 h-full z-50 flex-col transition-transform duration-300 ease-in-out border-r lg:hidden flex"
        style={{
          width: 256,
          backgroundColor: 'var(--color-sidebar-bg)',
          borderColor: 'var(--color-sidebar-border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          filter: 'drop-shadow(4px 0 24px rgba(0,0,0,0.25))',
        }}
      >
        <AdminSidebarContent
          isExpanded={true}
          user={user}
          activePage={activePage}
          onNavigate={(p) => {
            onNavigate(p);
            setMobileOpen(false);
          }}
          onToggle={() => setCollapsed(!collapsed)}
          onMobileClose={() => setMobileOpen(false)}
          onLogout={onLogout}
        />
      </aside>

      {/* Konten */}
      <div
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarW}px` }}
      >
        <AdminHeader
          title={title}
          subtitle={subtitle}
          user={user}
          onMobileMenu={() => setMobileOpen(true)}
        />
        <main style={{ padding: '1.5rem' }}>{children}</main>
      </div>
    </div>
  );
}

/* ── Isi sidebar (dipakai desktop & mobile) ── */
function AdminSidebarContent({
  isExpanded,
  user,
  activePage,
  onNavigate,
  onToggle,
  onMobileClose,
  onLogout,
}: {
  isExpanded: boolean;
  user: AdminUser;
  activePage: AdminPageName;
  onNavigate: (p: AdminPageName) => void;
  onToggle: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Brand */}
      <div
        className="flex items-center shrink-0 border-b"
        style={{
          padding: isExpanded ? '0.75rem 1rem' : '0.25rem',
          justifyContent: isExpanded ? 'space-between' : 'center',
          flexDirection: isExpanded ? 'row' : 'column',
          borderColor: 'var(--color-sidebar-border)',
          height: 64,
          cursor: 'pointer',
          gap: isExpanded ? 0 : '0.25rem',
        }}
        onClick={onToggle}
        title={!isExpanded ? 'Buka sidebar' : 'Tutup sidebar'}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center shrink-0 gap-3">
              <img src="/sidoarjoo.png" alt="Logo" style={{ width: 32, height: 32 }} className="object-contain rounded shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--color-sidebar-brand)' }}>Admin PJPK</h2>
                <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--color-sidebar-muted)' }}>Kabupaten Sidoarjo</p>
              </div>
            </div>
            <span
              className="p-1.5 rounded-lg hover:bg-slate-200/30 dark:hover:bg-slate-700/50 transition-colors hidden lg:flex items-center justify-center shrink-0"
              style={{ color: 'var(--color-sidebar-muted)' }}
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
            >
              <PanelLeftClose size={18} />
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); onMobileClose(); }}
              className="p-1.5 rounded-lg hover:bg-slate-200/30 dark:hover:bg-slate-700/50 transition-colors lg:hidden flex items-center justify-center shrink-0"
              style={{ color: 'var(--color-sidebar-muted)' }}
            >
              <X size={18} />
            </span>
          </>
        ) : (
          <>
            <img src="/sidoarjoo.png" alt="Logo" style={{ width: 28, height: 28 }} className="object-contain rounded shrink-0" />
            <span className="hidden lg:block" style={{ color: 'var(--color-sidebar-muted)' }}>
              <PanelLeftOpen size={14} />
            </span>
          </>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {isExpanded && (
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-sidebar-muted)' }}>
            Menu
          </p>
        )}
        {[...MENUS, ...(user.role === 'super_admin' ? SUPER_MENUS : user.role === 'admin_analis' ? ANALIS_MENUS : [])].map((m) => {
          const Icon = m.icon;
          return (
            <a
              key={m.key}
              href="#"
              className={`sidebar-link ${!isExpanded ? 'justify-center px-0' : ''} ${activePage === m.key ? 'active' : ''}`}
              style={{ padding: '16px 24px' }}
              onClick={(e) => { e.preventDefault(); onNavigate(m.key); }}
            >
              <Icon size={20} />
              {isExpanded && <span style={{ fontSize: '1rem' }}>{m.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* User + aksi */}
      <div className="shrink-0 border-t p-4 flex flex-col gap-3" style={{ borderColor: 'var(--color-sidebar-border)' }}>
        {isExpanded && (
          <div className="min-w-0 px-1">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-sidebar-brand)' }}>
              {user.name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-sidebar-muted)' }}>
              {user.role === 'admin_opd' && user.opd_nama
                ? user.opd_nama
                : user.role === 'admin_analis'
                  ? 'Admin Analis'
                  : 'Super Admin'}
            </p>
          </div>
        )}
        <a
          href="/"
          className={`sidebar-link ${!isExpanded ? 'justify-center px-0' : ''}`}
          style={{ padding: isExpanded ? '10px 16px' : '10px 0' }}
          title="Lihat dashboard publik"
        >
          <ExternalLink size={18} />
          {isExpanded && <span style={{ fontSize: '0.875rem' }}>Lihat Dashboard</span>}
        </a>
        <button
          onClick={onLogout}
          className={`sidebar-link ${!isExpanded ? 'justify-center px-0' : ''}`}
          style={{ padding: isExpanded ? '10px 16px' : '10px 0', width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
          title="Keluar"
        >
          <LogOut size={18} />
          {isExpanded && <span style={{ fontSize: '0.875rem' }}>Keluar</span>}
        </button>
      </div>
    </>
  );
}

/* ── Header konten (mobile hamburger + judul + theme toggle) ── */
function AdminHeader({
  title,
  subtitle,
  user,
  onMobileMenu,
}: {
  title: string;
  subtitle?: string;
  user: AdminUser;
  onMobileMenu: () => void;
}) {
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
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onMobileMenu}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Buka menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight truncate" style={{ color: 'var(--color-text)' }}>
            {title}
          </h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle ?? (user.role === 'admin_opd' && user.opd_nama ? user.opd_nama : 'Super Admin')}
          </p>
        </div>
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
