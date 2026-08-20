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
      return { bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', label: 'Tercapai' };
    case 'Hampir Tercapai':
      return { bg: 'rgba(234, 179, 8, 0.14)', color: '#ca8a04', label: 'Hampir Tercapai' };
    case 'Tidak Tercapai':
      return { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', label: 'Tidak Tercapai' };
    default:
      return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748b', label: 'Belum diisi' };
  }
}
