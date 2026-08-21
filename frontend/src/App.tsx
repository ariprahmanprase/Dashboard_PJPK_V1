import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Layout from '@/components/Layout';
import type { PageName } from '@/components/Sidebar';
import ReportPage from '@/pages/ReportPage';
import RencanaAksiPage from '@/pages/RencanaAksiPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminRenaksiPage from '@/pages/admin/AdminRenaksiPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminReportPage from '@/pages/admin/AdminReportPage';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import { fetchMe, getStoredUser, getToken, type AdminUser } from '@/services/admin';

function publicPageFromPath(): PageName {
  return window.location.pathname.startsWith('/rencana-aksi') ? 'rencana-aksi' : 'report';
}

export default function App() {
  // State di-inisialisasi dari URL — / langsung dashboard, /rencana-aksi halaman rencana aksi
  const [page, setPageState] = useState<PageName>(publicPageFromPath);

  // Sinkron URL saat navigasi; dukung tombol back/forward browser
  const setPage = (p: PageName) => {
    setPageState(p);
    const path = p === 'report' ? '/' : '/rencana-aksi';
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
  };

  useEffect(() => {
    const onPop = () => setPageState(publicPageFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
  const [page, setPage] = useState<AdminPageName>('report');

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

  const handleLogout = () => setUser(null);

  // Kelola user khusus super admin
  if (page === 'users' && user.role === 'super_admin') {
    return <AdminUsersPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  if (page === 'renaksi') {
    return <AdminRenaksiPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // Admin OPD: hanya menu Admin Renaksi
  if (user.role === 'admin_opd') {
    return <AdminRenaksiPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // Super admin & admin analis: Admin Report sebagai halaman default
  return <AdminReportPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
}
