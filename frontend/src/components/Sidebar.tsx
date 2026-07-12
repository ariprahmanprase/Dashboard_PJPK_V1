import { FileText, ListChecks, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export type PageName = 'report' | 'rencana-aksi';

interface Props {
  collapsed: boolean;
  activePage: PageName;
  onNavigate: (page: PageName) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, activePage, onNavigate, mobileOpen, onMobileClose, onToggle }: Props) {
  const sidebarWidth = collapsed ? 64 : 256;
  const isExpanded = !collapsed;

  function handleNav(page: PageName) {
    onNavigate(page);
    onMobileClose();
  }

  return (
    <>
      {/* Desktop: always visible, fixed left */}
      <aside
        className="fixed left-0 top-0 h-full z-50 flex-col transition-all duration-300 ease-in-out border-r hidden lg:flex"
        style={{
          width: sidebarWidth,
          backgroundColor: 'var(--color-sidebar-bg)',
          borderColor: 'var(--color-sidebar-border)',
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          isExpanded={isExpanded}
          activePage={activePage}
          onNavigate={handleNav}
          onToggle={onToggle}
          onMobileClose={onMobileClose}
        />
      </aside>

      {/* Tablet & Mobile: overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={onMobileClose}
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
        <SidebarContent
          collapsed={false}
          isExpanded={true}
          activePage={activePage}
          onNavigate={handleNav}
          onToggle={onToggle}
          onMobileClose={onMobileClose}
        />
      </aside>
    </>
  );
}

/* ── Shared inner sidebar content ── */
function SidebarContent({
  collapsed, isExpanded, activePage, onNavigate, onToggle, onMobileClose,
}: {
  collapsed: boolean;
  isExpanded: boolean;
  activePage: PageName;
  onNavigate: (p: PageName) => void;
  onToggle: () => void;
  onMobileClose: () => void;
}) {
  return (
    <>
      {/* Brand — clickable */}
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
        title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center shrink-0 gap-3">
              <img src="/sidoarjoo.png" alt="Logo" style={{ width: 32, height: 32 }} className="object-contain rounded shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--color-sidebar-brand)' }}>Dashboard PJPK</h2>
                <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--color-sidebar-muted)' }}>Kabupaten Sidoarjo</p>
              </div>
            </div>
            {/* Collapse toggle — desktop */}
            <span
              className="p-1.5 rounded-lg hover:bg-slate-200/30 dark:hover:bg-slate-700/50 transition-colors hidden lg:flex items-center justify-center shrink-0"
              style={{ color: 'var(--color-sidebar-muted)' }}
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
            >
              <PanelLeftClose size={18} />
            </span>
            {/* Tablet & Mobile close */}
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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {isExpanded && (
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-sidebar-muted)' }}>Menu</p>
        )}
        <a href="#" className={`sidebar-link ${!isExpanded ? 'justify-center px-0' : ''} ${activePage === 'report' ? 'active' : ''}`} style={{ padding: '16px 24px' }}
          onClick={(e) => { e.preventDefault(); onNavigate('report'); }}>
          <FileText size={20} />
          {isExpanded && <span style={{ fontSize: '1rem' }}>Report</span>}
        </a>
        <a href="#" className={`sidebar-link ${!isExpanded ? 'justify-center px-0' : ''} ${activePage === 'rencana-aksi' ? 'active' : ''}`} style={{ padding: '16px 24px' }}
          onClick={(e) => { e.preventDefault(); onNavigate('rencana-aksi'); }}>
          <ListChecks size={20} />
          {isExpanded && <span style={{ fontSize: '1rem' }}>Rencana Aksi</span>}
        </a>
      </nav>

      {/* Footer */}
      <div className="shrink-0 text-center border-t" style={{ padding: isExpanded ? '1rem' : '0.25rem', borderColor: 'var(--color-sidebar-border)' }}>
        <p className="text-[10px]" style={{ color: 'var(--color-sidebar-muted)' }}>{isExpanded ? '© 2026 PJPK Dashboard v1.0' : 'v1'}</p>
      </div>
    </>
  );
}
