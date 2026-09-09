import { useCallback, useEffect, useState } from 'react';
import { Layers, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import type { AdminPageName } from '@/components/admin/AdminLayout';
import MiniMarkdown from '@/lib/miniMarkdown';
import {
  deleteAiCrossPillar,
  fetchAiCrossPillar,
  fetchAiCrossPillarOptions,
  generateAiCrossPillar,
  type AdminUser,
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
 * P12 — Cross-Pillar Strategic Synthesis (wizard):
 * pilih tahun → Generate → sintesis seluruh pilar (bukan per indikator).
 * Hanya untuk role lintas dinas (admin OPD ditolak backend).
 */
export default function AdminCrossPillarPage({ user, onLogout, onNavigate }: Props) {
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [tahun, setTahun] = useState('');

  const [hasil, setHasil] = useState<AiIndikatorResult | null>(null);
  const [muatAwal, setMuatAwal] = useState(true);
  const [muatHasil, setMuatHasil] = useState(false);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar tahun acuan
  useEffect(() => {
    fetchAiCrossPillarOptions()
      .then(({ tahun }) => {
        setTahunList(tahun);
        if (tahun.length > 0) setTahun(tahun[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setMuatAwal(false));
  }, []);

  // Ambil hasil tersimpan tiap kali tahun berganti
  const muatHasilTersimpan = useCallback(async (t: string) => {
    if (!t) { setHasil(null); return; }
    setMuatHasil(true);
    setError('');
    try {
      setHasil(await fetchAiCrossPillar(t));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat sintesis.');
      setHasil(null);
    } finally {
      setMuatHasil(false);
    }
  }, []);

  useEffect(() => {
    muatHasilTersimpan(tahun);
  }, [tahun, muatHasilTersimpan]);

  const handleGenerate = async () => {
    if (!tahun) return;
    setProses(true);
    setError('');
    try {
      setHasil(await generateAiCrossPillar(tahun));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat sintesis.');
    } finally {
      setProses(false);
    }
  };

  const handleHapus = async () => {
    if (!tahun || !hasil) return;
    if (!window.confirm('Hapus sintesis lintas pilar tersimpan untuk tahun ini?')) return;
    setProses(true);
    setError('');
    try {
      await deleteAiCrossPillar(tahun);
      setHasil(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus sintesis.');
    } finally {
      setProses(false);
    }
  };

  return (
    <AdminLayout
      user={user}
      activePage="cross-pillar"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Sintesis Lintas Pilar"
      subtitle="P12 — Cross-Pillar Strategic Synthesis (AI)"
    >
      <div className="flex flex-col gap-8">
      {/* Wizard: pilih tahun */}
      <div
        className="rounded-xl border p-6"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-5">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Membaca <strong>seluruh pilar sekaligus</strong> untuk menemukan pola lintas pilar —
            bukan merangkum indikator satu per satu. Ditujukan untuk executive dashboard (Sekda/Bappeda).
          </p>

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
                disabled={muatAwal || tahunList.length === 0}
              >
                {tahunList.length === 0 && <option value="">—</option>}
                {tahunList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!tahun || proses}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #0d9488)' }}
            >
              {proses ? <Loader2 size={16} className="animate-spin" /> : (hasil ? <RefreshCw size={16} /> : <Layers size={16} />)}
              {proses ? 'Memproses…' : hasil ? 'Regenerate' : 'Generate Sintesis'}
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
        ) : muatHasil ? (
          <Placeholder><Loader2 size={16} className="inline animate-spin mr-2" />Memuat sintesis tersimpan…</Placeholder>
        ) : hasil ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  Sintesis Lintas Pilar PJPK · Tahun {tahun}
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
            Belum ada sintesis lintas pilar untuk tahun ini. Klik <strong>Generate Sintesis</strong> untuk membuatnya.
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
