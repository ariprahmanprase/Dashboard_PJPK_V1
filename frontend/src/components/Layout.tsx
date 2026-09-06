import PublicNavbar from './PublicNavbar';
import type { PageName } from './Sidebar';

interface Props {
  children: React.ReactNode;
  activePage: PageName;
  onNavigate: (page: PageName) => void;
}

/**
 * Layout halaman publik — navbar atas floating (draft UI).
 * Sidebar & Header lama tidak dipakai lagi di area publik.
 */
export default function Layout({ children, activePage, onNavigate }: Props) {
  return (
    <div className="public-scope">
      <PublicNavbar activePage={activePage} onNavigate={onNavigate} />
      <main
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '2.25rem 1.5rem 3rem',
        }}
      >
        {children}
      </main>
      <footer
        style={{
          borderTop: '1px solid hsl(var(--ds-border))',
          marginTop: '2rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'hsl(var(--ds-muted-foreground))',
        }}
      >
        <span style={{ color: 'hsl(var(--ds-primary))', fontWeight: 600 }}>Dashboard PJPK</span>
        {' '}— Kabupaten Sidoarjo · © 2026
      </footer>
    </div>
  );
}
