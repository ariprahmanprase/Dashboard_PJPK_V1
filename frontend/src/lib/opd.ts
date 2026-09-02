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
