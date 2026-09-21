/**
 * Normalisasi nama OPD ke dinas induknya (tampilan saja — data di DB tidak diubah).
 *
 * Menghapus embel-embel bidang/unit dalam kurung maupun setelah tanda ":" atau " - ",
 * mis:
 *   "Dinkopum (Bidang HI)"            -> "Dinkopum"
 *   "Dispendukcapil (Bid. Capil)"     -> "Dispendukcapil"
 *   "DP3AKB (Bid. Perlindungan Anak)" -> "DP3AKB"
 *   "Bakesbangpol : FKUB (Upaya …)"   -> "Bakesbangpol"
 *
 * Pengecualian: nama yang memang entitas tersendiri (Cabang Dinas/Bidang provinsi,
 * TP PKK, UPTD) dibiarkan apa adanya.
 */
export function opdInduk(nama: string | null | undefined): string {
  if (!nama) return '-';

  let s = nama.trim();

  // Entitas yang berdiri sendiri — jangan dipotong
  if (/^(Cabang|TP\s+PKK|UPTD)/i.test(s)) return s;

  // Potong mulai dari tanda ":" (mis. "Bakesbangpol : FKUB (…)")
  const colon = s.indexOf(':');
  if (colon > 0) s = s.slice(0, colon);

  // Potong mulai dari tanda kurung buka pertama (mis. "Dinkopum (Bidang HI)")
  const paren = s.indexOf('(');
  if (paren > 0) s = s.slice(0, paren);

  // Rapikan sisa spasi/tanda baca di ujung
  s = s.replace(/[\s,;\-–:]+$/, '').trim();

  return s !== '' ? s : nama.trim();
}

/**
 * Singkatan resmi/lazim OPD Pemkab Sidoarjo — untuk label chart yang sempit.
 * Nama lengkap tetap dipakai di tooltip & tabel; singkatan hanya untuk tampilan sumbu.
 */
const OPD_SINGKATAN: Record<string, string> = {
  'dinas kepemudaan, olah raga, dan pariwisata': 'Disporapar',
  'dinas kesehatan': 'Dinkes',
  'dinas koperasi dan umkm': 'Dinkopum',
  'dinas lingkungan hidup dan kehutanan': 'DLHK',
  'dinas pangan dan pertanian': 'DPP',
  'dinas pekerjaan umum dan bina marga': 'DPUBM',
  'dinas pemberdayaan masyarakat dan desa': 'DPMD',
  'dinas pemberdayaan perempuan, perlindungan anak dan keluarga berencana': 'DP3AKB',
  'dinas penanaman modal dan pelayanan terpadu satu pintu': 'DPMPTSP',
  'dinas pendidikan': 'Dispendik',
  'dinas perhubungan': 'Dishub',
  'dinas perikanan': 'Diskan',
  'dinas perindustrian dan perdagangan': 'Disperindag',
  'dinas perumahan permukiman cipta karya dan tata ruang': 'DPPR',
  'dinas sosial': 'Dinsos',
  'dinas tenaga kerja': 'Disnaker',
};

/**
 * Singkatan nama OPD untuk label chart. Urutan: singkatan dari DB -> peta resmi
 * -> opdInduk() -> inisial huruf kapital (fallback nama baru yang belum diisi).
 */
export function opdSingkat(nama: string | null | undefined, singkatanDb?: string | null): string {
  if (singkatanDb && singkatanDb.trim() !== '') return singkatanDb.trim();
  const induk = opdInduk(nama);
  const dariPeta = OPD_SINGKATAN[induk.toLowerCase()];
  if (dariPeta) return dariPeta;
  if (induk === '-' || induk.length <= 10) return induk;

  // Fallback: inisial dari huruf kapital / awal kata ("Dinas Foo Bar" -> "DFB")
  const kapital = induk.replace(/[^A-Z]/g, '');
  if (kapital.length >= 2) return kapital;
  const kata = induk.split(/\s+/).filter(Boolean);
  if (kata.length > 1) return kata.map(k => k[0].toUpperCase()).join('');
  return induk;
}

/**
 * Opsi dropdown filter OPD — satu opsi per entri, label nama asli lengkap
 * (tidak dinormalisasi/disingkat), value = id OPD. Diurutkan alfabetis.
 */
export function groupOpdOptions<T extends { id: number | string; nama_opd?: string; kode_opd?: string }>(
  list: T[],
  useKode = false,
): Array<{ label: string; value: string }> {
  return list
    .map(o => ({
      label: (useKode ? (o.nama_opd ?? o.kode_opd) : (o.nama_opd ?? o.kode_opd)) ?? '',
      value: String(o.id),
    }))
    .filter(o => o.label !== '')
    .sort((a, b) => a.label.localeCompare(b.label, 'id'));
}
