/**
 * Gaya status renaksi skema baru:
 * Tercapai (>=100%) hijau · Hampir Tercapai (90-99%) kuning ·
 * Tidak Tercapai (<90%) merah · Belum diisi abu-abu.
 */
export interface RenaksiStatusStyle {
  bg: string;
  color: string;
  label: string;
}

export function renaksiStatusStyle(status: string): RenaksiStatusStyle {
  switch (status) {
    case 'Tercapai':
      return { bg: 'rgba(0, 166, 81, 0.12)', color: '#00a651', label: 'Tercapai' };
    case 'Hampir Tercapai':
      return { bg: 'rgba(230, 200, 0, 0.16)', color: '#b8a300', label: 'Hampir Tercapai' };
    case 'Tidak Tercapai':
      return { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', label: 'Tidak Tercapai' };
    default:
      return { bg: 'hsl(var(--ds-muted-foreground) / 0.12)', color: 'hsl(var(--ds-muted-foreground))', label: 'Belum diisi' };
  }
}
