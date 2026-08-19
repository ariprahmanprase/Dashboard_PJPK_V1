import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Layout from '@/components/Layout';
import type { PageName } from '@/components/Sidebar';
import ReportPage from '@/pages/ReportPage';
import RencanaAksiPage from '@/pages/RencanaAksiPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminRenaksiPage from '@/pages/admin/AdminRenaksiPage';
import { fetchMe, getStoredUser, getToken, type AdminUser } from '@/services/admin';

export default function App() {
  const [page, setPage] = useState<PageName>('report');

  // Area admin: /admin
  if (window.location.pathname.startsWith('/admin')) {
    return (
      <ThemeProvider>
        <AdminArea />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Layout activePage={page} onNavigate={setPage}>
        {page === 'report' ? <ReportPage /> : <RencanaAksiPage />}
      </Layout>
    </ThemeProvider>
  );
}

function AdminArea() {
  const [user, setUser] = useState<AdminUser | null>(() => (getToken() ? getStoredUser() : null));
  const [checking, setChecking] = useState(() => getToken() !== null);

  useEffect(() => {
    if (!getToken()) return;
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-sm"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
      >
        Memeriksa sesi…
      </div>
    );
  }

  if (!user) {
    return <AdminLoginPage onSuccess={() => setUser(getStoredUser())} />;
  }

  return <AdminRenaksiPage user={user} onLogout={() => setUser(null)} />;
}
