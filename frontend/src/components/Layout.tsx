import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar collapsed={collapsed} />
      <div
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? 64 : 256 }}
      >
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main style={{ padding: '1.5rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
