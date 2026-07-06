import { FileText } from 'lucide-react';

interface Props {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: Props) {
  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out border-r"
      style={{
        width: collapsed ? 64 : 256,
        backgroundColor: 'var(--color-sidebar-bg)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center shrink-0 border-b"
        style={{
          padding: collapsed ? '1rem 0.5rem' : '1rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : '0.75rem',
          borderColor: 'rgba(255,255,255,0.08)',
          height: 64,
        }}
      >
        <img
          src="/sidoarjoo.png"
          alt="Logo"
          style={{ width: 32, height: 32 }}
          className="object-contain rounded shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white leading-tight">Dashboard PJPK</h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">Kabupaten Sidoarjo</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Menu
          </p>
        )}
        <a href="#" className={`sidebar-link ${collapsed ? 'justify-center px-0' : ''} active`}>
          <FileText size={20} />
          {!collapsed && 'Report'}
        </a>
      </nav>

      {/* Footer */}
      <div
        className="shrink-0 text-center border-t"
        style={{
          padding: collapsed ? '1rem 0.25rem' : '1rem',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <p className="text-[10px] text-slate-500">
          {collapsed ? 'v1' : '© 2026 PJPK Dashboard v1.0'}
        </p>
      </div>
    </aside>
  );
}
