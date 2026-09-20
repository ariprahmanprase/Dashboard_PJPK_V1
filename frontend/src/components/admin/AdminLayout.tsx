import { useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  DatabaseZap,
  ExternalLink,
  FileText,
  Gauge,
  Layers,
  Lightbulb,
  LogOut,
  Menu,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Siren,
  Sparkles,
  Stethoscope,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import type { AdminUser } from '@/services/admin';

export type AdminPageName = 'report' | 'renaksi' | 'users' | 'opds' | 'profile' | 'analisis-indikator' | 'portofolio-opd' | 'root-cause' | 'efektivitas' | 'corrective-action' | 'red-alert' | 'data-gap' | 'psri' | 'cross-opd' | 'executive-brief' | 'cross-pillar' | 'innovation';

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

// Admin Indikator — super admin & admin analis (di atas Admin Renaksi)
const INDIKATOR_MENU: AdminMenuItem[] = [
  { key: 'report', label: 'Admin Indikator', icon: FileText },
];

// Menu analisis AI — semua role (hak akses indikator/OPD dibatasi di backend)
const AI_MENUS: AdminMenuItem[] = [
  { key: 'analisis-indikator', label: 'Analisis Indikator', icon: Sparkles },
  { key: 'portofolio-opd', label: 'Portofolio OPD', icon: Briefcase },
  { key: 'root-cause', label: 'Root Cause', icon: Search },
  { key: 'efektivitas', label: 'Efektivitas', icon: Gauge },
  { key: 'corrective-action', label: 'Action Plan', icon: ClipboardCheck },
  { key: 'red-alert', label: 'Red Alert', icon: Siren },
  { key: 'data-gap', label: 'Data Gap', icon: DatabaseZap },
  { key: 'psri', label: 'PSRI Diagnosis', icon: Stethoscope },
  { key: 'cross-opd', label: 'Lintas OPD', icon: Network },
  { key: 'executive-brief', label: 'Executive Brief', icon: FileText },
  { key: 'innovation', label: 'Inovasi', icon: Lightbulb },
];

// Menu AI khusus role lintas dinas (bukan admin OPD) — sintesis seluruh pilar
const AI_MENUS_LINTAS: AdminMenuItem[] = [
  { key: 'cross-pillar', label: 'Sintesis Pilar', icon: Layers },
];

// Menu profil dihapus dari daftar menu — diganti blok user di bawah sidebar yang bisa diklik

// Menu khusus admin analis: (kosong — Admin Indikator pindah ke atas via INDIKATOR_MENU)
const ANALIS_MENUS: AdminMenuItem[] = [];

// Menu khusus super admin
const SUPER_MENUS: AdminMenuItem[] = [
  { key: 'users', label: 'User', icon: Users },
  { key: 'opds', label: 'OPD', icon: Building2 },
];

/* ── Deteksi layar desktop (≥ lg = 1024px) untuk margin konten ── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

export default function AdminLayout({ user, activePage, onNavigate, onLogout, title, subtitle, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktop();
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
        style={{ marginLeft: isDesktop ? sidebarW : 0 }}
      >
        <AdminHeader
          title={title}
          subtitle={subtitle}
          user={user}
          onMobileMenu={() => setMobileOpen(true)}
        />
        <main className="p-4 lg:p-6">{children}</main>
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
              <img src="/logo-sidoarjo.webp" alt="Logo Kabupaten Sidoarjo" style={{ width: 34, height: 34 }} className="object-contain shrink-0" />
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
            <img src="/logo-sidoarjo.webp" alt="Logo Kabupaten Sidoarjo" style={{ width: 30, height: 30 }} className="object-contain shrink-0" />
            <span className="hidden lg:block" style={{ color: 'var(--color-sidebar-muted)' }}>
              <PanelLeftOpen size={14} />
            </span>
          </>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {isExpanded && (
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-sidebar-muted)' }}>
            Menu
          </p>
        )}

        {/* Admin Indikator — super admin & admin analis, paling atas */}
        {user.role !== 'admin_opd' &&
          INDIKATOR_MENU.map((m) => (
            <MenuLink key={m.key} m={m} isExpanded={isExpanded} activePage={activePage} onNavigate={onNavigate} />
          ))}

        {/* Menu utama */}
        {MENUS.map((m) => (
          <MenuLink key={m.key} m={m} isExpanded={isExpanded} activePage={activePage} onNavigate={onNavigate} />
        ))}

        {/* Grup Analisis AI (collapsible) */}
        <AiMenuGroup
          isExpanded={isExpanded}
          user={user}
          activePage={activePage}
          onNavigate={onNavigate}
        />

        {/* Menu peran (profil dipindah ke blok user di bawah) */}
        {[...(user.role === 'super_admin' ? SUPER_MENUS : user.role === 'admin_analis' ? ANALIS_MENUS : [])].map((m) => (
          <MenuLink key={m.key} m={m} isExpanded={isExpanded} activePage={activePage} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* User + aksi */}
      <div className="shrink-0 border-t p-4 flex flex-col gap-3" style={{ borderColor: 'var(--color-sidebar-border)' }}>
        {isExpanded && (
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate('profile'); }}
            className={`sidebar-link ${activePage === 'profile' ? 'active' : ''}`}
            style={{ padding: '10px 16px', alignItems: 'center', gap: '0.75rem' }}
            title="Profil"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-sidebar-hover)', color: 'var(--color-sidebar-muted)' }}
              >
                <UserRound size={18} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: 'inherit' }}>
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
          </a>
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

/* ── Satu item menu sidebar ── */
function MenuLink({
  m,
  isExpanded,
  activePage,
  onNavigate,
}: {
  m: AdminMenuItem;
  isExpanded: boolean;
  activePage: AdminPageName;
  onNavigate: (p: AdminPageName) => void;
}) {
  const Icon = m.icon;
  return (
    <a
      href="#"
      className={`sidebar-link ${!isExpanded ? 'justify-center px-0' : ''} ${activePage === m.key ? 'active' : ''}`}
      style={{ padding: isExpanded ? '10px 16px' : '10px 0' }}
      onClick={(e) => { e.preventDefault(); onNavigate(m.key); }}
      title={!isExpanded ? m.label : undefined}
    >
      <Icon size={18} />
      {isExpanded && <span style={{ fontSize: '0.875rem' }}>{m.label}</span>}
    </a>
  );
}

/* ── Grup menu Analisis AI (collapsible) ── */
function AiMenuGroup({
  isExpanded,
  user,
  activePage,
  onNavigate,
}: {
  isExpanded: boolean;
  user: AdminUser;
  activePage: AdminPageName;
  onNavigate: (p: AdminPageName) => void;
}) {
  const aiKeys = [...AI_MENUS, ...AI_MENUS_LINTAS].map((m) => m.key) as string[];
  const adaAktif = aiKeys.includes(activePage);
  const [buka, setBuka] = useState(adaAktif);

  // Auto-buka grup saat salah satu menu AI aktif
  useEffect(() => {
    if (adaAktif) setBuka(true);
  }, [adaAktif]);

  const items = [...AI_MENUS, ...(user.role !== 'admin_opd' ? AI_MENUS_LINTAS : [])];

  // Sidebar dilipat: tampilkan ikon AI saja, klik → buka sidebar + grup
  if (!isExpanded) {
    return (
      <a
        href="#"
        className={`sidebar-link justify-center px-0 ${adaAktif ? 'active' : ''}`}
        style={{ padding: '10px 0' }}
        onClick={(e) => { e.preventDefault(); /* parent toggle membuka sidebar */ }}
        title="Analisis AI"
      >
        <Sparkles size={18} />
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className="sidebar-link w-full"
        style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer' }}
      >
        <Sparkles size={18} />
        <span style={{ fontSize: '0.875rem', flex: 1, textAlign: 'left' }}>Analisis AI</span>
        {buka ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {buka && (
        <div className="flex flex-col gap-0.5 mt-0.5 ml-4 pl-3 border-l" style={{ borderColor: 'var(--color-sidebar-border)' }}>
          {items.map((m) => {
            const Icon = m.icon;
            return (
              <a
                key={m.key}
                href="#"
                className={`sidebar-link ${activePage === m.key ? 'active' : ''}`}
                style={{ padding: '7px 12px' }}
                onClick={(e) => { e.preventDefault(); onNavigate(m.key); }}
              >
                <Icon size={15} />
                <span style={{ fontSize: '0.8125rem' }}>{m.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
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
      className="flex items-center justify-between shrink-0 border-b px-4 lg:px-6 min-h-16 py-2 lg:py-0"
      style={{
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
          <p className="text-xs mt-0.5 line-clamp-2 lg:truncate leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
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
