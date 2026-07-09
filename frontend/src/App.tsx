import { useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import Layout from '@/components/Layout';
import type { PageName } from '@/components/Sidebar';
import ReportPage from '@/pages/ReportPage';
import RencanaAksiPage from '@/pages/RencanaAksiPage';

export default function App() {
  const [page, setPage] = useState<PageName>('report');

  return (
    <ThemeProvider>
      <Layout activePage={page} onNavigate={setPage}>
        {page === 'report' ? <ReportPage /> : <RencanaAksiPage />}
      </Layout>
    </ThemeProvider>
  );
}
