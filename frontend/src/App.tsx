import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Layout from '@/components/Layout';
import type { PageName } from '@/components/Sidebar';
import ReportPage from '@/pages/ReportPage';
import RencanaAksiPage from '@/pages/RencanaAksiPage';
import RankPage from '@/pages/RankPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminRenaksiPage from '@/pages/admin/AdminRenaksiPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminReportPage from '@/pages/admin/AdminReportPage';
import AdminProfilePage from '@/pages/admin/AdminProfilePage';
import AdminAnalisisIndikatorPage from '@/pages/admin/AdminAnalisisIndikatorPage';
import AdminPortofolioOpdPage from '@/pages/admin/AdminPortofolioOpdPage';
import AdminRootCausePage from '@/pages/admin/AdminRootCausePage';
import AdminEfektivitasPage from '@/pages/admin/AdminEfektivitasPage';
import AdminCorrectiveActionPage from '@/pages/admin/AdminCorrectiveActionPage';
import AdminRedAlertPage from '@/pages/admin/AdminRedAlertPage';
import AdminDataGapPage from '@/pages/admin/AdminDataGapPage';
import AdminPsriPage from '@/pages/admin/AdminPsriPage';
import AdminCrossOpdPage from '@/pages/admin/AdminCrossOpdPage';
import AdminExecutiveBriefPage from '@/pages/admin/AdminExecutiveBriefPage';
import AdminCrossPillarPage from '@/pages/admin/AdminCrossPillarPage';
import AdminInnovationPage from '@/pages/admin/AdminInnovationPage';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import { clearSession, fetchMe, getStoredUser, getToken, logout, type AdminUser } from '@/services/admin';

function publicPageFromPath(): PageName {
  const p = window.location.pathname;
  if (p.startsWith('/rencana-aksi')) return 'rencana-aksi';
  if (p.startsWith('/rank')) return 'rank';
  return 'report';
}

function publicPathFromPage(page: PageName): string {
  if (page === 'rencana-aksi') return '/rencana-aksi';
  if (page === 'rank') return '/rank';
  return '/';
}

export default function App() {
  // State di-inisialisasi dari URL — / langsung dashboard, /rencana-aksi halaman rencana aksi
  const [page, setPageState] = useState<PageName>(publicPageFromPath);

  // Sinkron URL saat navigasi; dukung tombol back/forward browser
  const setPage = (p: PageName) => {
    setPageState(p);
    const path = publicPathFromPage(p);
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
        {page === 'report' ? <ReportPage /> : page === 'rank' ? <RankPage /> : <RencanaAksiPage />}
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
      .catch(() => {
        // Token ada tapi sudah tidak valid — bersihkan sesi supaya tidak dianggap login
        clearSession();
        setUser(null);
      })
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

  // Logout harus membersihkan token di localStorage (bukan hanya state) —
  // kalau tidak, sidebar publik masih menganggap user login
  const handleLogout = () => {
    logout().catch(() => {});
    setUser(null);
  };

  // Kelola user khusus super admin
  if (page === 'users' && user.role === 'super_admin') {
    return <AdminUsersPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // Profil — semua role bisa edit biodata & password sendiri
  if (page === 'profile') {
    return <AdminProfilePage user={user} onLogout={handleLogout} onNavigate={setPage} onUserUpdated={setUser} />;
  }

  if (page === 'renaksi') {
    return <AdminRenaksiPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P1 — Analisis Kinerja Indikator (AI) — semua role
  if (page === 'analisis-indikator') {
    return <AdminAnalisisIndikatorPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P2 — Analisis Portofolio OPD (AI) — semua role
  if (page === 'portofolio-opd') {
    return <AdminPortofolioOpdPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P3 — Root Cause Analysis (AI) — semua role (admin OPD dibatasi dinasnya di backend)
  if (page === 'root-cause') {
    return <AdminRootCausePage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P4 — Activity-Outcome Effectiveness (AI) — semua role (admin OPD dibatasi dinasnya di backend)
  if (page === 'efektivitas') {
    return <AdminEfektivitasPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P5 — Corrective Action Generator (AI, chaining dari P1/P3/P4) — semua role
  if (page === 'corrective-action') {
    return <AdminCorrectiveActionPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P6 — Red Indicator Alert (AI, hanya indikator berstatus merah) — semua role
  if (page === 'red-alert') {
    return <AdminRedAlertPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P7 — Data Gap Analysis (AI, indikator dengan data belum memadai) — semua role
  if (page === 'data-gap') {
    return <AdminDataGapPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P8 — PSRI Policy Diagnosis (AI) — semua role (admin OPD dibatasi dinasnya di backend)
  if (page === 'psri') {
    return <AdminPsriPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P9 — Cross-OPD Coordination (AI, hanya indikator lintas sektor) — semua role
  if (page === 'cross-opd') {
    return <AdminCrossOpdPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P10 — Executive Brief (AI, chaining dari analisis per indikator) — semua role
  if (page === 'executive-brief') {
    return <AdminExecutiveBriefPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P12 — Cross-Pillar Strategic Synthesis (AI, seluruh pilar) — hanya role lintas dinas
  if (page === 'cross-pillar') {
    return <AdminCrossPillarPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // P13 — Innovation Miner (AI, per renaksi/kegiatan) — semua role
  if (page === 'innovation') {
    return <AdminInnovationPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // Admin OPD: hanya menu Admin Renaksi
  if (user.role === 'admin_opd') {
    return <AdminRenaksiPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
  }

  // Super admin & admin analis: Admin Report sebagai halaman default
  return <AdminReportPage user={user} onLogout={handleLogout} onNavigate={setPage} />;
}
