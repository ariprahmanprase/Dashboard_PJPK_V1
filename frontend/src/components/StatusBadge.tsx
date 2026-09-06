interface Props {
  status: string;
  warna: string;
}

const styles: Record<string, { bg: string; text: string }> = {
  Hijau: {
    bg: 'rgba(0, 166, 81, 0.1)',
    text: '#00a651',
  },
  Kuning: {
    bg: 'rgba(230, 200, 0, 0.15)',
    text: '#b8a300',
  },
  Merah: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#dc2626',
  },
  Abu: {
    bg: 'hsl(var(--ds-muted-foreground) / 0.1)',
    text: 'hsl(var(--ds-muted-foreground))',
  },
};

const darkStyles: Record<string, { bg: string; text: string }> = {
  Hijau: {
    bg: 'rgba(0, 166, 81, 0.2)',
    text: '#4ade80',
  },
  Kuning: {
    bg: 'rgba(230, 200, 0, 0.18)',
    text: '#f5e97a',
  },
  Merah: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#fca5a5',
  },
  Abu: {
    bg: 'hsl(var(--ds-muted-foreground) / 0.12)',
    text: 'hsl(var(--ds-muted-foreground))',
  },
};

export default function StatusBadge({ status, warna }: Props) {
  const s = styles[warna] || styles.Abu;
  const ds = darkStyles[warna] || darkStyles.Abu;

  return (
    <>
      <span
        className={`dark:hidden inline-block font-medium rounded-lg ${warna === 'Merah' ? 'alert-badge' : ''}`}
        style={{
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          backgroundColor: s.bg,
          color: s.text,
        }}
      >
        {status}
      </span>
      <span
        className={`hidden dark:inline-block font-medium rounded-lg ${warna === 'Merah' ? 'alert-badge' : ''}`}
        style={{
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          backgroundColor: ds.bg,
          color: ds.text,
        }}
      >
        {status}
      </span>
    </>
  );
}
