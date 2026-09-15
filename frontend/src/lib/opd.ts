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
 * Singkatan nama OPD untuk label chart. Urutan: peta resmi -> opdInduk() ->
 * inisial huruf kapital (fallback nama baru yang belum terdaftar).
 */
export function opdSingkat(nama: string | null | undefined): string {
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
 * Kelompokkan daftar OPD per dinas induk untuk dropdown filter —
 * menghilangkan duplikat label (mis. 3 bidang Dinkopum -> 1 opsi "Dinkopum").
 * Value opsi = id semua bidang digabung koma ("105,116,117"), didukung backend.
 */
export function groupOpdOptions<T extends { id: number | string; nama_opd?: string; kode_opd?: string }>(
  list: T[],
  useKode = false,
): Array<{ label: string; value: string }> {
  const map = new Map<string, string[]>();
  for (const o of list) {
    const label = opdInduk(useKode ? (o.kode_opd ?? o.nama_opd) : (o.nama_opd ?? o.kode_opd));
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(String(o.id));
  }
  return [...map.entries()].map(([label, ids]) => ({ label, value: ids.join(',') }));
}
