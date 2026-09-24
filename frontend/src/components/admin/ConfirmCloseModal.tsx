import { TriangleAlert } from 'lucide-react';

interface Props {
  /** Pesan utama dialog */
  message?: string;
  /** Tutup dialog, kembali ke form */
  onLanjutkan: () => void;
  /** Buang perubahan & tutup form */
  onKeluar: () => void;
}

/**
 * Dialog konfirmasi saat form yang sudah diisi (dirty) hendak ditutup —
 * dipakai semua modal form admin (klik di luar / tombol X / Batal).
 * zIndex tertinggi (z-[90]) agar tampil di atas modal form (z-50/z-[70]).
 */
export default function ConfirmCloseModal({
  message = 'Perubahan yang belum disimpan akan hilang.',
  onLanjutkan,
  onKeluar,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onLanjutkan}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className="p-2 rounded-lg shrink-0"
            style={{ backgroundColor: 'rgba(234,179,8,0.12)', color: '#ca8a04' }}
          >
            <TriangleAlert size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Lanjutkan pengisian?
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onKeluar}
            className="rounded-lg border px-4 py-2.5 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            style={{ borderColor: 'var(--color-border)', color: '#dc2626' }}
          >
            Keluar
          </button>
          <button
            type="button"
            onClick={onLanjutkan}
            autoFocus
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
