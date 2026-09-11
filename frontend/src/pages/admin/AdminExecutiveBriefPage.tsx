import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import MiniMarkdown from '@/lib/miniMarkdown';
import {
  deleteAiExecBrief,
  fetchAiExecBriefOptions,
  fetchAiExecBriefStatus,
  generateAiExecBrief,
  type AdminUser,
  type AiCorrectiveStatus,
  type AiIndikatorOption,
  type AiIndikatorResult,
  type AiSumberOption,
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
 * P10 — Executive Brief (wizard):
 * pilih indikator + tahun + sumber analisis → Generate brief maks 250 kata
 * untuk Bupati/Sekda. Chaining: butuh hasil analisis yang sudah tersimpan.
 */
export default function AdminExecutiveBriefPage({ user, onLogout, onNavigate }: Props) {
  const [opsi, setOpsi] = useState<AiIndikatorOption[]>([]);
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [sumberList, setSumberList] = useState<AiSumberOption[]>([]);
  const [kode, setKode] = useState('');
  const [tahun, setTahun] = useState('');
  const [sumber, setSumber] = useState('');

  const [status, setStatus] = useState<AiCorrectiveStatus | null>(null);
  const [muatOpsi, setMuatOpsi] = useState(true);
  const [muatStatus, setMuatStatus] = useState(false);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar indikator + tahun + sumber
  useEffect(() => {
    fetchAiExecBriefOptions()
      .then(({ indikator, tahun, sumber }) => {
        setOpsi(indikator);
        setTahunList(tahun);
        setSumberList(sumber);
        if (tahun.length > 0) setTahun(tahun[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setMuatOpsi(false));
  }, []);

  const indikatorTerpilih = useMemo(() => opsi.find((o) => o.kode === kode) ?? null, [opsi, kode]);

  // Muat status sumber & brief tersimpan tiap kali indikator/tahun berganti
  const muatStatusTersimpan = useCallback(async (k: string, t: string) => {
    if (!k || !t) { setStatus(null); return; }
    setMuatStatus(true);
    setError('');
    try {
      const s = await fetchAiExecBriefStatus(k, t);
      setStatus(s);
      setSumber((cur) => (cur && s.sumber_tersedia.includes(cur) ? cur : (s.sumber_tersedia[0] ?? '')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat status analisis.');
      setStatus(null);
    } finally {
      setMuatStatus(false);
    }
  }, []);

  useEffect(() => {
    muatStatusTersimpan(kode, tahun);
  }, [kode, tahun, muatStatusTersimpan]);

  const hasil: AiIndikatorResult | null = sumber ? (status?.tersimpan[sumber] ?? null) : null;

  const handleGenerate = async () => {
    if (!kode || !tahun || !sumber) return;
    setProses(true);
    setError('');
    try {
      const h = await generateAiExecBrief(kode, tahun, sumber);
      setStatus((cur) => cur ? { ...cur, tersimpan: { ...cur.tersimpan, [sumber]: h } } : cur);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat executive brief.');
    } finally {
      setProses(false);
    }
  };

  const handleHapus = async () => {
    if (!kode || !tahun || !sumber || !hasil) return;
    if (!window.confirm(`Hapus executive brief (dari ${sumber}) untuk indikator & tahun ini?`)) return;
    setProses(true);
    setError('');
    try {
      await deleteAiExecBrief(kode, tahun, sumber);
      setStatus((cur) => {
        if (!cur) return cur;
        const tersimpan = { ...cur.tersimpan };
        delete tersimpan[sumber];
        return { ...cur, tersimpan };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus brief.');
    } finally {
      setProses(false);
    }
  };

  const sumberTersedia = status?.sumber_tersedia ?? [];

  return (
    <AdminLayout
      user={user}
      activePage="executive-brief"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Executive Brief"
      subtitle="AI merangkum analisis menjadi brief singkat (maks 250 kata) siap dibaca Bupati/Sekda."
    >
      <div className="flex flex-col gap-8">
      {/* Wizard: pilih indikator + tahun + sumber */}
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
              Meringkas hasil analisis menjadi brief maksimal 250 kata yang bisa dibaca pimpinan dalam satu menit.
            </p>
          </div>

          {/* Tahun + sumber + tombol */}
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Ringkas dari Analisis
              </label>
              <select
                value={sumber}
                onChange={(e) => setSumber(e.target.value)}
                className="rounded-lg border px-3 py-2.5 text-sm min-w-64"
                style={selectStyle}
                disabled={muatStatus || !kode || sumberTersedia.length === 0}
              >
                {sumberTersedia.length === 0 && <option value="">— belum ada analisis tersimpan —</option>}
                {sumberList.filter((s) => sumberTersedia.includes(s.kode)).map((s) => (
                  <option key={s.kode} value={s.kode}>{s.kode} — {s.nama}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!kode || !tahun || !sumber || proses}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #0d9488)' }}
            >
              {proses ? <Loader2 size={16} className="animate-spin" /> : (hasil ? <RefreshCw size={16} /> : <FileText size={16} />)}
              {proses ? 'Memproses…' : hasil ? 'Regenerate' : 'Generate Brief'}
            </button>
          </div>

          {kode && !muatStatus && sumberTersedia.length === 0 && (
            <p className="text-xs" style={{ color: '#d97706' }}>
              Belum ada hasil analisis untuk indikator & tahun ini. Buat dulu analisisnya
              (menu Analisis Indikator / Root Cause / Efektivitas / Red Alert / Data Gap / PSRI / Lintas OPD),
              lalu kembali ke sini untuk meringkasnya.
            </p>
          )}
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
          <Placeholder>Pilih indikator terlebih dahulu untuk melihat atau membuat executive brief.</Placeholder>
        ) : muatStatus ? (
          <Placeholder><Loader2 size={16} className="inline animate-spin mr-2" />Memuat status analisis…</Placeholder>
        ) : hasil ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {indikatorTerpilih?.kode} — {indikatorTerpilih?.nama_indikator} · Tahun {tahun} · dari {sumber}
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
        ) : sumber ? (
          <Placeholder>
            Belum ada executive brief dari <strong>{sumber}</strong> untuk indikator & tahun ini.
            Klik <strong>Generate Brief</strong> untuk membuatnya.
          </Placeholder>
        ) : (
          <Placeholder>
            Pilih sumber analisis yang sudah tersedia untuk diringkas menjadi brief.
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
