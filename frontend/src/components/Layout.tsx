import { useState } from 'react';
import Sidebar, { type PageName } from './Sidebar';
import Header from './Header';

interface Props {
  children: React.ReactNode;
  activePage: PageName;
  onNavigate: (page: PageName) => void;
}

export default function Layout({ children, activePage, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? 64 : 256;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar
        collapsed={collapsed}
        activePage={activePage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <div
        className="min-h-screen transition-all duration-300 ease-in-out layout-content"
        style={{
          marginLeft: `${sidebarW}px`,
          marginRight: collapsed ? `${sidebarW}px` : '0px',
        }}
      >
        <Header onMobileMenu={() => setMobileOpen(true)} />
        <main style={{ padding: '1.5rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
