import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Loader2 } from 'lucide-react';

interface Props {
  /** Object URL gambar yang akan di-crop */
  imageSrc: string;
  onCancel: () => void;
  /** Dipanggil dengan Blob hasil crop 1:1 (JPEG) */
  onDone: (blob: Blob) => Promise<void> | void;
}

/**
 * Modal crop interaktif ke rasio 1:1 (bentuk lingkaran sebagai panduan).
 * User bisa geser & zoom; hasil akhir digambar ke <canvas> lalu diekspor JPEG.
 */
export default function AvatarCropModal({ imageSrc, onCancel, onDone }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [proses, setProses] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!area) return;
    setProses(true);
    try {
      const blob = await getCroppedBlob(imageSrc, area);
      await onDone(blob);
    } finally {
      setProses(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sesuaikan Foto (1:1)</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Geser dan atur zoom agar wajah pas di dalam lingkaran.
          </p>
        </div>

        <div className="relative w-full" style={{ height: 320, backgroundColor: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="w-full"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={proses}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={proses || !area}
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {proses && <Loader2 className="animate-spin" size={14} />}
              {proses ? 'Menyimpan…' : 'Simpan Foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Gambar area terpilih ke canvas dan ekspor sebagai Blob JPEG. */
async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = Math.round(Math.min(area.width, area.height));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung browser.');

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal memproses gambar.'));
    }, 'image/jpeg', 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar.'));
    img.src = src;
  });
}
