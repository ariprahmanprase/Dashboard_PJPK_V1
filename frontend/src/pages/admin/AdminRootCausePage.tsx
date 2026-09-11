import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import MiniMarkdown from '@/lib/miniMarkdown';
import {
  deleteAiRootCause,
  fetchAiRootCause,
  fetchAiRootCauseOptions,
  generateAiRootCause,
  type AdminUser,
  type AiIndikatorOption,
  type AiIndikatorResult,
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
 * P3 — Root Cause Analysis (wizard):
 * pilih indikator + tahun → Generate → hasil tersimpan (bisa regenerate / hapus).
 * Dipakai saat gap besar, tren memburuk, atau akar masalah belum jelas.
 */
export default function AdminRootCausePage({ user, onLogout, onNavigate }: Props) {
  const [opsi, setOpsi] = useState<AiIndikatorOption[]>([]);
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [kode, setKode] = useState('');
  const [tahun, setTahun] = useState('');

  const [hasil, setHasil] = useState<AiIndikatorResult | null>(null);
  const [muatOpsi, setMuatOpsi] = useState(true);
  const [muatHasil, setMuatHasil] = useState(false);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar indikator + tahun
  useEffect(() => {
    fetchAiRootCauseOptions()
      .then(({ indikator, tahun }) => {
        setOpsi(indikator);
        setTahunList(tahun);
        if (tahun.length > 0) setTahun(tahun[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setMuatOpsi(false));
  }, []);

  const indikatorTerpilih = useMemo(() => opsi.find((o) => o.kode === kode) ?? null, [opsi, kode]);

  // Ambil hasil tersimpan tiap kali indikator/tahun berganti
  const muatHasilTersimpan = useCallback(async (k: string, t: string) => {
    if (!k || !t) { setHasil(null); return; }
    setMuatHasil(true);
    setError('');
    try {
      setHasil(await fetchAiRootCause(k, t));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat analisis.');
      setHasil(null);
    } finally {
      setMuatHasil(false);
    }
  }, []);

  useEffect(() => {
    muatHasilTersimpan(kode, tahun);
  }, [kode, tahun, muatHasilTersimpan]);

  const handleGenerate = async () => {
    if (!kode || !tahun) return;
    setProses(true);
    setError('');
    try {
      setHasil(await generateAiRootCause(kode, tahun));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat analisis.');
    } finally {
      setProses(false);
    }
  };

  const handleHapus = async () => {
    if (!kode || !tahun || !hasil) return;
    if (!window.confirm('Hapus root cause analysis tersimpan untuk indikator & tahun ini?')) return;
    setProses(true);
    setError('');
    try {
      await deleteAiRootCause(kode, tahun);
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
      activePage="root-cause"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Root Cause Analysis"
      subtitle="AI mencari akar penyebab kenapa suatu indikator tidak tercapai, bukan sekadar gejalanya."
    >
      <div className="flex flex-col gap-8">
      {/* Wizard: pilih indikator + tahun */}
      <div
        className="rounded-xl border p-6"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-5">
          {/* Indikator */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Indikator
            </label>
            <select
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              style={selectStyle}
              disabled={muatOpsi}
            >
              <option value="">{muatOpsi ? 'Memuat…' : `— Pilih indikator (${opsi.length}) —`}</option>
              {opsi.map((o) => (
                <option key={o.kode} value={o.kode}>
                  {o.kode} — {o.nama_indikator}
                </option>
              ))}
            </select>
            {indikatorTerpilih && (
              <p className="mt-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Pilar: <span style={{ color: 'var(--color-text)' }}>{indikatorTerpilih.pilar ?? '-'}</span>
              </p>
            )}
            <p className="mt-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Gunakan saat gap besar, tren memburuk, atau akar masalah belum jelas.
            </p>
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
              disabled={!kode || !tahun || proses}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #0d9488)' }}
            >
              {proses ? <Loader2 size={16} className="animate-spin" /> : (hasil ? <RefreshCw size={16} /> : <Search size={16} />)}
              {proses ? 'Memproses…' : hasil ? 'Regenerate' : 'Generate Root Cause'}
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
        {!kode ? (
          <Placeholder>Pilih indikator terlebih dahulu untuk melihat atau membuat root cause analysis.</Placeholder>
        ) : muatHasil ? (
          <Placeholder><Loader2 size={16} className="inline animate-spin mr-2" />Memuat analisis tersimpan…</Placeholder>
        ) : hasil ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {indikatorTerpilih?.kode} — {indikatorTerpilih?.nama_indikator} · Tahun {tahun}
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
            Belum ada root cause analysis untuk indikator & tahun ini. Klik <strong>Generate Root Cause</strong> untuk membuatnya.
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
