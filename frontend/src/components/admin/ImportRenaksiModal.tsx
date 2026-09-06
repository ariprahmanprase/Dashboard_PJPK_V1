import { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import {
  downloadImportTemplate,
  previewImportRenaksi,
  storeImportRenaksi,
  type ImportPreviewRow,
} from '@/services/admin';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void; // dipanggil setelah simpan sukses (untuk refresh tabel)
}

type Step = 'pilih' | 'preview' | 'tersimpan';

export default function ImportRenaksiModal({ open, onClose, onImported }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pilih');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  if (!open) return null;

  const reset = () => {
    setStep('pilih');
    setFileName('');
    setRows([]);
    setValidCount(0);
    setErrorCount(0);
    setError('');
    setSavedCount(0);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setError('');
    try {
      await downloadImportTemplate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengunduh template.');
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    setLoading(true);
    setFileName(file.name);
    try {
      const res = await previewImportRenaksi(file);
      setRows(res.rows);
      setValidCount(res.valid_count);
      setErrorCount(res.error_count);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca file.');
      setStep('pilih');
    } finally {
      setLoading(false);
    }
  };

  const handleSimpan = async () => {
    setError('');
    setLoading(true);
    try {
      const validRows = rows.filter(r => r.valid).map(r => r.data);
      const res = await storeImportRenaksi(validRows);
      setSavedCount(res.saved);
      setStep('tersimpan');
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const thStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: '0.688rem',
    padding: '0.625rem 0.875rem',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
  };
  const tdStyle: React.CSSProperties = {
    padding: '0.5rem 0.875rem',
    fontSize: '0.8125rem',
    color: 'var(--color-text)',
    verticalAlign: 'top',
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={handleClose}
    >
      <div
        className="rounded-2xl shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          maxWidth: 920,
          width: '94%',
          maxHeight: '86vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div>
            <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Impor Renaksi dari Excel</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Unduh template → isi → unggah untuk preview → simpan
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0" style={{ color: 'var(--color-text-secondary)' }} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', flex: 1, minHeight: 0, padding: '1.5rem' }}>
          {error && (
            <div className="rounded-lg mb-4" style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontSize: '0.813rem' }}>
              {error}
            </div>
          )}

          {/* ── Langkah 1: pilih file ── */}
          {step === 'pilih' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                style={{ padding: '1.25rem', borderColor: 'var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', background: 'transparent' }}
              >
                <Download size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold">Unduh Template Excel</span>
              </button>

              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors"
                style={{ padding: '2.5rem 1.5rem', borderColor: 'var(--color-border)', cursor: 'pointer' }}
                onClick={() => fileInput.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0] ?? null); }}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={28} style={{ color: 'var(--color-text-secondary)' }} />
                ) : (
                  <Upload size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
                )}
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {loading ? 'Membaca file…' : 'Klik atau seret file Excel ke sini'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Format .xlsx / .xls, maks 5 MB</p>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}

          {/* ── Langkah 2: preview ── */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{fileName}</span>
                <span className="inline-flex items-center gap-1 rounded-full" style={{ padding: '0.15rem 0.625rem', fontSize: '0.75rem', backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                  <CheckCircle2 size={13} /> {validCount} valid
                </span>
                {errorCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full" style={{ padding: '0.15rem 0.625rem', fontSize: '0.75rem', backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>
                    <XCircle size={13} /> {errorCount} error
                  </span>
                )}
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                <div className="overflow-x-auto" style={{ maxHeight: '46vh', overflowY: 'auto' }}>
                  <table className="w-full text-sm" style={{ minWidth: 860, borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-secondary)', zIndex: 1 }}>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Tahun</th>
                        <th style={thStyle}>Rencana Aksi</th>
                        <th style={thStyle}>Jenis</th>
                        <th style={thStyle}>Target</th>
                        <th style={thStyle}>Realisasi</th>
                        <th style={thStyle}>Status Baca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <tr key={row.no} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: row.valid ? 'transparent' : 'rgba(239,68,68,0.05)' }}>
                          <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{row.no}</td>
                          <td style={tdStyle}>{row.data.tahun || '—'}</td>
                          <td style={{ ...tdStyle, maxWidth: 260 }}><span className="line-clamp-2">{row.data.rencana_aksi || '—'}</span></td>
                          <td style={tdStyle}>{row.data.jenis_target ?? '—'}</td>
                          <td style={tdStyle}>
                            {row.data.jenis_target === 'kuantitatif'
                              ? (row.data.target_nilai !== null ? `${row.data.target_nilai} ${row.data.target_satuan ?? ''}`.trim() : '—')
                              : (row.data.target ?? '—')}
                          </td>
                          <td style={tdStyle}>
                            {row.data.jenis_target === 'kuantitatif'
                              ? (row.data.realisasi_nilai !== null ? String(row.data.realisasi_nilai) : '—')
                              : (row.data.realisasi ?? '—')}
                          </td>
                          <td style={{ ...tdStyle, maxWidth: 240 }}>
                            {row.valid ? (
                              <span className="inline-flex items-center gap-1" style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                                <CheckCircle2 size={14} /> Valid
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                {row.errors.map((err, i) => (
                                  <span key={i} className="inline-flex items-start gap-1" style={{ color: '#dc2626', fontSize: '0.72rem', lineHeight: 1.3 }}>
                                    <XCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} /> {err}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Hanya baris <strong>valid</strong> yang akan disimpan. Indikator terkait bisa dilengkapi setelah data masuk lewat menu edit.
              </p>
            </div>
          )}

          {/* ── Langkah 3: tersimpan ── */}
          {step === 'tersimpan' && (
            <div className="flex flex-col items-center justify-center" style={{ padding: '3rem 1rem', gap: '0.75rem' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--color-primary)' }} />
              <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{savedCount} renaksi berhasil diimpor</p>
              <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)', maxWidth: 420 }}>
                Data sudah masuk. Anda bisa melengkapi indikator terkait tiap renaksi lewat tombol edit pada tabel.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          {step === 'preview' && (
            <>
              <button onClick={reset} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                Ganti File
              </button>
              <button
                onClick={handleSimpan}
                disabled={loading || validCount === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2"
                style={{
                  backgroundColor: validCount === 0 ? 'var(--color-border)' : 'var(--color-primary)',
                  color: '#fff',
                  cursor: validCount === 0 || loading ? 'default' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading && <Loader2 className="animate-spin" size={15} />}
                Simpan {validCount} Renaksi
              </button>
            </>
          )}
          {step === 'tersimpan' && (
            <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
