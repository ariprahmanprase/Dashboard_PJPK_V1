interface Props {
  status: string;
  warna: string;
}

const styles: Record<string, { bg: string; text: string }> = {
  Hijau: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: '#16a34a',
  },
  Kuning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    text: '#b45309',
  },
  Merah: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#dc2626',
  },
  Abu: {
    bg: 'rgba(148, 163, 184, 0.1)',
    text: '#64748b',
  },
};

const darkStyles: Record<string, { bg: string; text: string }> = {
  Hijau: {
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#86efac',
  },
  Kuning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#fcd34d',
  },
  Merah: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#fca5a5',
  },
  Abu: {
    bg: 'rgba(148, 163, 184, 0.1)',
    text: '#94a3b8',
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
