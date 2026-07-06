import { ThemeProvider } from '@/components/ui/theme-provider';
import Layout from '@/components/Layout';
import ReportPage from '@/pages/ReportPage';

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <ReportPage />
      </Layout>
    </ThemeProvider>
  );
}
