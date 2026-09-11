import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import MiniMarkdown from '@/lib/miniMarkdown';
import {
  deleteAiOpd,
  fetchAiOpd,
  fetchAiOpdOptions,
  generateAiOpd,
  type AdminUser,
  type AiIndikatorResult,
  type AiOpdOption,
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
 * P2 — OPD Portfolio Review (wizard):
 * pilih OPD + tahun → Generate → hasil tersimpan (bisa regenerate / hapus).
 * Admin OPD otomatis terkunci ke dinasnya (dropdown hanya berisi dinasnya).
 */
export default function AdminPortofolioOpdPage({ user, onLogout, onNavigate }: Props) {
  const [opsi, setOpsi] = useState<AiOpdOption[]>([]);
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [opdId, setOpdId] = useState<number | ''>('');
  const [tahun, setTahun] = useState('');

  const [hasil, setHasil] = useState<AiIndikatorResult | null>(null);
  const [muatOpsi, setMuatOpsi] = useState(true);
  const [muatHasil, setMuatHasil] = useState(false);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState('');

  const isAdminOpd = user.role === 'admin_opd';

  // Muat daftar OPD + tahun; admin OPD otomatis terpilih dinasnya
  useEffect(() => {
    fetchAiOpdOptions()
      .then(({ opd, tahun }) => {
        setOpsi(opd);
        setTahunList(tahun);
        if (tahun.length > 0) setTahun(tahun[0]);
        if (isAdminOpd && opd.length > 0) setOpdId(opd[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setMuatOpsi(false));
  }, [isAdminOpd]);

  const opdTerpilih = useMemo(() => opsi.find((o) => o.id === opdId) ?? null, [opsi, opdId]);

  const muatHasilTersimpan = useCallback(async (id: number | '', t: string) => {
    if (!id || !t) { setHasil(null); return; }
    setMuatHasil(true);
    setError('');
    try {
      setHasil(await fetchAiOpd(id, t));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat analisis.');
      setHasil(null);
    } finally {
      setMuatHasil(false);
    }
  }, []);

  useEffect(() => {
    muatHasilTersimpan(opdId, tahun);
  }, [opdId, tahun, muatHasilTersimpan]);

  const handleGenerate = async () => {
    if (!opdId || !tahun) return;
    setProses(true);
    setError('');
    try {
      setHasil(await generateAiOpd(opdId, tahun));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat analisis.');
    } finally {
      setProses(false);
    }
  };

  const handleHapus = async () => {
    if (!opdId || !tahun || !hasil) return;
    if (!window.confirm('Hapus analisis tersimpan untuk OPD & tahun ini?')) return;
    setProses(true);
    setError('');
    try {
      await deleteAiOpd(opdId, tahun);
      setHasil(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus analisis.');
    } finally {
      setProses(false);
    }
  };

  return (
    <AdminLayout
      user={user}
      activePage="portofolio-opd"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Analisis Portofolio OPD"
      subtitle="AI menilai kinerja satu dinas/OPD secara keseluruhan dari semua indikator yang menjadi tanggung jawabnya."
    >
      <div className="flex flex-col gap-8">
        {/* Wizard: pilih OPD + tahun */}
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-5">
            {/* OPD */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                OPD
              </label>
              <select
                value={opdId}
                onChange={(e) => setOpdId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                style={selectStyle}
                disabled={muatOpsi || isAdminOpd}
              >
                <option value="">{muatOpsi ? 'Memuat…' : `— Pilih OPD (${opsi.length}) —`}</option>
                {opsi.map((o) => (
                  <option key={o.id} value={o.id}>{o.nama_opd}</option>
                ))}
              </select>
              {isAdminOpd && opdTerpilih && (
                <p className="mt-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Anda hanya dapat menganalisis portofolio dinas Anda sendiri.
                </p>
              )}
            </div>

            {/* Tahun + tombol */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Tahun
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="rounded-lg border px-3 py-2.5 text-sm min-w-28"
                  style={selectStyle}
                  disabled={muatOpsi || tahunList.length === 0}
                >
                  {tahunList.length === 0 && <option value="">—</option>}
                  {tahunList.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!opdId || !tahun || proses}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary, #0d9488)' }}
              >
                {proses ? <Loader2 size={16} className="animate-spin" /> : (hasil ? <RefreshCw size={16} /> : <Sparkles size={16} />)}
                {proses ? 'Memproses…' : hasil ? 'Regenerate' : 'Generate Analisis'}
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
          {!opdId ? (
            <Placeholder>Pilih OPD terlebih dahulu untuk melihat atau membuat analisis.</Placeholder>
          ) : muatHasil ? (
            <Placeholder><Loader2 size={16} className="inline animate-spin mr-2" />Memuat analisis tersimpan…</Placeholder>
          ) : hasil ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {opdTerpilih?.nama_opd} · Tahun {tahun}
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
              Belum ada analisis untuk OPD & tahun ini. Klik <strong>Generate Analisis</strong> untuk membuatnya.
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
