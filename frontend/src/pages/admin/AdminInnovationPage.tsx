import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lightbulb, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import MiniMarkdown from '@/lib/miniMarkdown';
import {
  deleteAiInnovation,
  fetchAiInnovation,
  fetchAiInnovationOptions,
  fetchAiInnovationTahun,
  generateAiInnovation,
  type AdminUser,
  type AiIndikatorResult,
  type AiRenaksiOption,
} from '@/services/admin';

interface Props {
  user: AdminUser;
  onLogout: () => void;
  onNavigate: (page: AdminPageName) => void;
}

const selectStyle = {
  backgroundColor: 'var(--color-bg)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

/**
 * P13 — Innovation Miner (wizard):
 * pilih tahun → pilih renaksi/kegiatan → Generate penilaian inovasi
 * (BUKAN INOVASI / POTENSIAL / TERBUKTI / LAYAK DIREPLIKASI).
 */
export default function AdminInnovationPage({ user, onLogout, onNavigate }: Props) {
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [tahun, setTahun] = useState('');
  const [opsi, setOpsi] = useState<AiRenaksiOption[]>([]);
  const [renaksiId, setRenaksiId] = useState<number | null>(null);

  const [hasil, setHasil] = useState<AiIndikatorResult | null>(null);
  const [muatAwal, setMuatAwal] = useState(true);
  const [muatOpsi, setMuatOpsi] = useState(false);
  const [muatHasil, setMuatHasil] = useState(false);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar tahun renaksi
  useEffect(() => {
    fetchAiInnovationTahun()
      .then((t) => {
        setTahunList(t);
        if (t.length > 0) setTahun(t[t.length - 1]); // default: tahun terbaru
      })
      .catch((e) => setError(e.message))
      .finally(() => setMuatAwal(false));
  }, []);

  // Muat renaksi setiap tahun berganti
  useEffect(() => {
    if (!tahun) { setOpsi([]); setRenaksiId(null); return; }
    setMuatOpsi(true);
    setRenaksiId(null);
    fetchAiInnovationOptions(tahun)
      .then(setOpsi)
      .catch((e) => setError(e.message))
      .finally(() => setMuatOpsi(false));
  }, [tahun]);

  const renaksiTerpilih = useMemo(() => opsi.find((o) => o.id === renaksiId) ?? null, [opsi, renaksiId]);

  // Ambil hasil tersimpan tiap kali renaksi berganti
  const muatHasilTersimpan = useCallback(async (id: number | null) => {
    if (!id) { setHasil(null); return; }
    setMuatHasil(true);
    setError('');
    try {
      setHasil(await fetchAiInnovation(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat penilaian.');
      setHasil(null);
    } finally {
      setMuatHasil(false);
    }
  }, []);

  useEffect(() => {
    muatHasilTersimpan(renaksiId);
  }, [renaksiId, muatHasilTersimpan]);

  const handleGenerate = async () => {
    if (!renaksiId) return;
    setProses(true);
    setError('');
    try {
      setHasil(await generateAiInnovation(renaksiId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat penilaian.');
    } finally {
      setProses(false);
    }
  };

  const handleHapus = async () => {
    if (!renaksiId || !hasil) return;
    if (!window.confirm('Hapus penilaian inovasi tersimpan untuk kegiatan ini?')) return;
    setProses(true);
    setError('');
    try {
      await deleteAiInnovation(renaksiId);
      setHasil(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus penilaian.');
    } finally {
      setProses(false);
    }
  };

  return (
    <AdminLayout
      user={user}
      activePage="innovation"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Innovation Miner"
      subtitle="AI menemukan praktik/inovasi yang berhasil di satu tempat dan layak ditiru oleh OPD lain."
    >
      <div className="flex flex-col gap-8">
      {/* Wizard: pilih tahun + renaksi */}
      <div
        className="rounded-xl border p-6"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-5">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Menilai apakah suatu kegiatan layak disebut <strong>inovasi</strong> dan berpotensi direplikasi —
            bukan hanya karena baru dilaksanakan. Kegiatan tanpa bukti hasil tidak bisa dinilai.
          </p>

          <div className="flex flex-wrap gap-4 items-end">
            {/* Tahun */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Tahun
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="rounded-lg border px-3 py-2.5 text-sm min-w-28"
                style={selectStyle}
                disabled={muatAwal || tahunList.length === 0}
              >
                {tahunList.length === 0 && <option value="">—</option>}
                {tahunList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Renaksi */}
            <div className="flex-1 min-w-72">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Kegiatan / Rencana Aksi
              </label>
              <select
                value={renaksiId ?? ''}
                onChange={(e) => setRenaksiId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                style={selectStyle}
                disabled={muatOpsi || !tahun || opsi.length === 0}
              >
                <option value="">
                  {muatOpsi ? 'Memuat…' : opsi.length === 0 ? '— tidak ada renaksi tahun ini —' : `— Pilih kegiatan (${opsi.length}) —`}
                </option>
                {opsi.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.rencana_aksi} — {o.opd ?? '-'} [{o.status ?? 'Belum diisi'}]
                  </option>
                ))}
              </select>
              {renaksiTerpilih?.program && (
                <p className="mt-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Program: <span style={{ color: 'var(--color-text)' }}>{renaksiTerpilih.program}</span>
                </p>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!renaksiId || proses}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #0d9488)' }}
            >
              {proses ? <Loader2 size={16} className="animate-spin" /> : (hasil ? <RefreshCw size={16} /> : <Lightbulb size={16} />)}
              {proses ? 'Memproses…' : hasil ? 'Regenerate' : 'Nilai Inovasi'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Hasil */}
      <div
        className="rounded-xl border p-6 md:p-8"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        {muatAwal ? (
          <Placeholder><Loader2 size={16} className="inline animate-spin mr-2" />Memuat…</Placeholder>
        ) : !renaksiId ? (
          <Placeholder>Pilih kegiatan terlebih dahulu untuk melihat atau membuat penilaian inovasi.</Placeholder>
        ) : muatHasil ? (
          <Placeholder><Loader2 size={16} className="inline animate-spin mr-2" />Memuat penilaian tersimpan…</Placeholder>
        ) : hasil ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {renaksiTerpilih?.rencana_aksi} · {renaksiTerpilih?.opd} · Tahun {tahun}
                </h3>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Model: {hasil.model ?? '-'}
                  {hasil.updated_at ? ` · Diperbarui ${hasil.updated_at}` : ''}
                  {hasil.oleh ? ` · oleh ${hasil.oleh}` : ''}
                </p>
              </div>
              <button
                onClick={handleHapus}
                disabled={proses}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626' }}
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
            <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
              <MiniMarkdown text={hasil.hasil} />
            </div>
          </>
        ) : (
          <Placeholder>
            Belum ada penilaian inovasi untuk kegiatan ini. Klik <strong>Nilai Inovasi</strong> untuk membuatnya.
          </Placeholder>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </div>
  );
}
