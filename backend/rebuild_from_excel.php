<?php
/**
 * Rebuild data PJPK dari Excel "Maping Analisa Indikator.xlsx" (Data 09.09).
 *
 * Keputusan user (9 Sep 2026):
 * - Tetap 30 indikator; yang tidak ada di Excel dikosongkan (tanpa renaksi/target 2025)
 * - Kode indikator diganti P-xx -> I-01..I-30
 * - OPD dibersihkan jadi 17 sesuai Excel; OPD lama + user admin_opd-nya dihapus
 * - "Belum dapat dipetakan" (7 baris) dibuang
 * - Arah target ikut konfigurasi lama (tidak diubah)
 * - Target rentang: simpan batas BAWAH, capaian dalam rentang -> Hijau (aturan user)
 * - Nilai campur: ambil nilai pertama / sesuai aturan user (6,6 untuk AKB; 297 orang untuk disabilitas)
 * - Status renaksi enum tetap; mapping: Tercapai->Tercapai, Belum tercapai->Tidak Tercapai,
 *   Tidak dapat dinilai->Belum diisi
 * - Semua data tahun 2025
 *
 * Jalankan: C:\xampp\php\php.exe rebuild_from_excel.php
 * Opsi: --dry-run untuk simulasi tanpa menulis DB.
 */

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$DRY_RUN = in_array('--dry-run', $argv);
$TAHUN = '2025';
$EXCEL = 'C:\Arip\STIESIA\Data PJPK\Data 09.09\Maping Analisa Indikator.xlsx';

echo ($DRY_RUN ? "=== DRY RUN ===" : "=== EKSEKUSI NYATA ===") . "\n\n";

// ---------------------------------------------------------------------------
// Parser helpers
// ---------------------------------------------------------------------------

/** Parse angka format Indonesia: "29.176" -> 29176, "0,343" -> 0.343, "145.53" -> 145.53 */
function parseNum($s): ?float
{
    if ($s === null) return null;
    // Sel Excel bertipe angka native -> langsung pakai, jangan di-string-kan lalu ditebak
    if (is_int($s) || is_float($s)) return (float)$s;
    $s = trim((string)$s);
    if ($s === '' || $s === '-') return null;
    // buang spasi & nbsp
    $s = str_replace(["\xc2\xa0", ' '], '', $s);
    if (strpos($s, ',') !== false && strpos($s, '.') !== false) {
        // keduanya ada: anggap '.' pemisah ribuan, ',' desimal (format ID)
        $s = str_replace('.', '', $s);
        $s = str_replace(',', '.', $s);
    } elseif (strpos($s, ',') !== false) {
        $s = str_replace(',', '.', $s);
    } elseif (strpos($s, '.') !== false) {
        // hanya '.': pola ribuan hanya kalau BUKAN mulai dengan 0 dan 3 digit setelah titik
        // ("29.176" -> 29176, tapi "0.316" tetap 0.316)
        if (preg_match('/^[1-9]\d{0,2}(\.\d{3})+$/', $s)) {
            $s = str_replace('.', '', $s);
        } // else biarkan sebagai desimal
    }
    return is_numeric($s) ? (float)$s : null;
}

/** Parse target indikator sesuai aturan user. Return [target, capaian, keterangan] */
function parseTargetIndikator(string $indikator, $targetRaw, $capaianRaw): array
{
    $ket = null;
    $target = parseNum($targetRaw);
    $capaian = null;

    $targetStr = is_numeric($targetRaw) ? (string)$targetRaw : trim((string)$targetRaw);
    $capRaw = is_numeric($capaianRaw) ? (string)$capaianRaw : trim((string)$capaianRaw);
    // "6,6 atau 10,48 (siperindu)" -> ambil 6,6 (aturan user)
    if (preg_match('/^([\d\.,]+)\s*atau\s*([\d\.,]+)/', $capRaw, $m)) {
        $capaian = parseNum($m[1]);
        $ket = 'Realisasi ganda: diambil nilai pertama (' . $m[1] . '); nilai lain: ' . $m[2];
    } else {
        $capaian = parseNum($capRaw);
    }

    // Target rentang "4,53-4,12" -> ambil batas bawah (aturan user: capaian dalam rentang = Hijau)
    if ($targetStr && preg_match('/^\s*([\d\.,]+)\s*[-–]\s*([\d\.,]+)\s*$/', $targetStr, $m)) {
        $a = parseNum($m[1]); $b = parseNum($m[2]);
        $target = min($a, $b);
        $ket = trim(($ket ? $ket . ' | ' : '') . "Target rentang {$m[1]}–{$m[2]}: disimpan batas bawah ($target)");
    }

    // "0,04 persen - 297 orang" -> ambil 297 orang (aturan user)
    if ($targetStr && stripos($targetStr, 'persen') !== false && strpos($targetStr, '-') !== false) {
        if (preg_match('/-\s*([\d\.,]+)\s*orang/i', $targetStr, $m)) {
            $target = parseNum($m[1]);
            $ket = trim(($ket ? $ket . ' | ' : '') . 'Target campur persen+orang: diambil nilai orang (' . $m[1] . ')');
        }
    }
    // "315 orang" -> 315
    if ($capRaw && preg_match('/^\s*([\d\.,]+)\s*orang\s*$/i', $capRaw, $m)) {
        $capaian = parseNum($m[1]);
    }
    // "89,77% - 212 rumah ..." -> ambil 89,77
    if ($targetStr && preg_match('/^\s*([\d\.,]+)\s*%/', $targetStr, $m)) {
        $target = parseNum($m[1]);
    }
    if ($capRaw && preg_match('/^\s*([\d\.,]+)\s*%/', $capRaw, $m)) {
        $capaian = parseNum($m[1]);
    }

    return [$target, $capaian, $ket];
}

/** Parse target/realisasi renaksi. Return [jenis, nilai, satuan, teksAsli] */
function parseNilaiRenaksi($raw): array
{
    // Sel angka native -> kuantitatif langsung
    if (is_int($raw) || is_float($raw)) {
        return ['kuantitatif', (float)$raw, null, (string)$raw];
    }
    $raw = trim((string)$raw);
    if ($raw === '' || $raw === '-') return [null, null, null, null];

    // angka murni
    if (preg_match('/^[\d\.,]+$/', $raw)) {
        return ['kuantitatif', parseNum($raw), null, $raw];
    }
    // angka + satuan: "6 Sekolah", "29.176 orang", "100 %", "7500 paket"
    // syarat: sisa teks pendek dan tidak mengandung angka lain (kalau tidak -> kualitatif)
    if (preg_match('/^([\d\.,]+)\s*([%]|[A-Za-z][A-Za-z0-9\/\.\(\) ]*)$/u', $raw, $m)) {
        $satuan = trim($m[2]);
        if ($satuan !== '' && mb_strlen($satuan) <= 30 && !preg_match('/\d/', $satuan)) {
            return ['kuantitatif', parseNum($m[1]), $satuan, $raw];
        }
        if ($satuan === '') {
            return ['kuantitatif', parseNum($m[1]), null, $raw];
        }
        // satuan tidak bersih -> jatuh ke kualitatif
        return ['kualitatif', null, null, $raw];
    }
    // "Investasi: 12,12 Triliun"
    if (preg_match('/^([A-Za-z ]+):\s*([\d\.,]+)\s*(.*)$/u', $raw, $m)) {
        $satuan = trim($m[3]) !== '' ? trim($m[3]) : trim($m[1]);
        return ['kuantitatif', parseNum($m[2]), $satuan, $raw];
    }
    // kompleks -> kualitatif
    return ['kualitatif', null, null, $raw];
}

/** Map status Excel -> enum DB */
function mapStatus(string $s): string
{
    return match (mb_strtolower(trim($s))) {
        'tercapai' => 'Tercapai',
        'belum tercapai' => 'Tidak Tercapai',
        'tidak dapat dinilai' => 'Belum diisi',
        default => 'Belum diisi',
    };
}

/** Normalisasi nama pilar Excel -> id pilar DB (nama baru tetap dipertahankan) */
$pilarMap = [
    1 => 'Pilar 1: Pengendalian Kuantitas Penduduk',
    2 => 'Pilar 2: Peningkatan Kualitas Penduduk',
    3 => 'Pilar 3: Pembangunan Keluarga',
    4 => 'Pilar 4: Penataan Persebaran dan Pengarahan Mobilitas Penduduk',
    5 => 'Pilar 5: Penataan Administrasi Data Kependudukan',
];
function pilarKe(string $excelPilar): ?int
{
    $t = mb_strtolower($excelPilar);
    foreach ([1, 2, 3, 4, 5] as $n) {
        if (preg_match('/pilar\s*(ke\s*)?(' . $n . '|' . ['', 'i', 'ii', 'iii', 'iv', 'v'][$n] . ')\b/', $t)) return $n;
    }
    return null;
}

// ---------------------------------------------------------------------------
// 17 OPD dari Excel (kode -> [kode_opd, nama_opd])
// ---------------------------------------------------------------------------
$opdBaru = [
    'DP3AKB'     => ['DP3AKB', 'Dinas Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga Berencana'],
    'Dinsos'     => ['Dinsos', 'Dinas Sosial'],
    'Dinkes'     => ['Dinkes', 'Dinas Kesehatan'],
    'Disporapar' => ['Disporapar', 'Dinas Kepemudaan, Olah Raga, dan Pariwisata'],
    'Disdukcapil'=> ['Disdukcapil', 'Dinas Kependudukan dan Pencatatan Sipil'],
    'DPMPTSP'    => ['DPMPTSP', 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu'],
    'Dispendik'  => ['Dispendik', 'Dinas Pendidikan'],
    'Dishub'     => ['Dishub', 'Dinas Perhubungan'],
    'DLHK'       => ['DLHK', 'Dinas Lingkungan Hidup dan Kehutanan'],
    'DPUBM'      => ['DPUBM', 'Dinas Pekerjaan Umum dan Bina Marga'],
    'Disnaker'   => ['Disnaker', 'Dinas Tenaga Kerja'],
    'Diskop UM'  => ['Diskop UM', 'Dinas Koperasi dan UMKM'],
    'DP2CKTR'    => ['DP2CKTR', 'Dinas Perumahan Permukiman Cipta Karya dan Tata Ruang'],
    'DKPP'       => ['DKPP', 'Dinas Pangan dan Pertanian'],
    'DPMD'       => ['DPMD', 'Dinas Pemberdayaan Masyarakat dan Desa'],
    'Disperindag'=> ['Disperindag', 'Dinas Perindustrian dan Perdagangan'],
    'Diskan'     => ['Diskan', 'Dinas Perikanan'],
];

/** Ambil kode OPD dari teks "DP3AKB (Dinas ...)" */
function kodeOpd(string $f): string
{
    if (preg_match('/^([^(]+)\s*\(/', $f, $m)) return trim($m[1]);
    return trim($f);
}

// ---------------------------------------------------------------------------
// Satuan indikator (inferensi, untuk direview user)
// ---------------------------------------------------------------------------
$satuanIndikator = [
    'Total Fertility Rate (TFR)' => 'anak/wanita',
    'Age-Specific Fertility Rate (ASFR) 15-19 tahun' => 'per 1.000 wanita 15-19 th',
    'Proporsi Kebutuhan KB yang Terpenuhi (Demand Satisfied)' => '%',
    'Rata-Rata Lama Sekolah Penduduk Usia 15 Tahun ke Atas (tahun)' => 'tahun',
    'Angka Partisipasi Kasar (APK) Perguruan Tinggi (%)' => '%',
    'Jumlah Tenaga Kerja Tersertifikasi Kompetensi Kerja/ Persentase Pekerja Lulusan Pendidikan Menengah dan Tinggi yang Bekerja di Bidang Keahlian Menengah Tinggi' => 'orang',
    'Prevalensi Stunting (Persentase Balita dengan Tinggi Badan di Bawah Standar)' => '%',
    'Angka Kematian Bayi (AKB)' => 'per 1.000 kelahiran hidup',
    'Angka Kematian Ibu (AKI)' => 'per 100.000 kelahiran hidup',
    'Tingkat Kemiskinan' => '%',
    'Tingkat Partisipasi Angkatan Kerja Perempuan' => '%',
    'Persentase Pekerja Informal' => '%',
    'Persentase Penyandang Disabilitas Bekerja di Sektor Formal' => 'orang',
    'Gini Ratio' => 'indeks',
    'Produk Domestik Regional Bruto (PDRB) Perkapita' => 'juta rupiah',
    'Tingkat Pengangguran Terbuka' => '%',
    'Indeks Pembangunan Keluarga (i-bangga)' => 'indeks',
    'Indeks Perlindungan Anak' => 'indeks',
    'Rumah Tangga dengan Akses Hunian Layak, Terjangkau, dan Berkelanjutan (%)' => '%',
    'Rumah Tangga dengan Akses Sanitasi Aman (%)' => '%',
    'Indeks Pengasuhan Keluarga yang Memiliki Remaja' => 'indeks',
    'Cakupan Kepesertaan Jaminan Kesehatan Nasional (%)' => '%',
    'Kepadatan Penduduk' => 'jiwa/km²',
];

// Alias nama Excel -> nama DB (untuk yang redaksinya beda)
$aliasNama = [
    'Prevalensi stunting' => 'Prevalensi Stunting (Persentase Balita dengan Tinggi Badan di Bawah Standar)',
];

// ---------------------------------------------------------------------------
// Baca Excel
// ---------------------------------------------------------------------------
$wb = PhpOffice\PhpSpreadsheet\IOFactory::load($EXCEL);
$s = $wb->getSheet(0);
$maxRow = $s->getHighestRow();

$rows = [];
for ($r = 2; $r <= $maxRow; $r++) {
    $ind = trim((string)$s->getCell('B' . $r)->getValue());
    if ($ind === '' || $ind === 'Belum dapat dipetakan') continue;
    $rows[] = [
        'no'              => trim((string)$s->getCell('A' . $r)->getValue()),
        'indikator_excel' => $ind,
        'indikator_db'    => $aliasNama[$ind] ?? $ind,
        // nilai mentah (bisa float/int/string) — parsing di parseTargetIndikator
        'target_ind'      => $s->getCell('C' . $r)->getValue(),
        'realisasi_ind'   => $s->getCell('D' . $r)->getValue(),
        'renaksi'         => trim((string)$s->getCell('E' . $r)->getValue()),
        'opd_raw'         => trim((string)$s->getCell('F' . $r)->getValue()),
        'target_ren'      => $s->getCell('G' . $r)->getValue(),
        'realisasi_ren'   => $s->getCell('H' . $r)->getValue(),
        'status'          => trim((string)$s->getCell('I' . $r)->getValue()),
        'dasar'           => trim((string)$s->getCell('K' . $r)->getValue()),
        'catatan'         => trim((string)$s->getCell('L' . $r)->getValue()),
        'pilar_raw'       => trim((string)$s->getCell('M' . $r)->getValue()),
    ];
}
echo "Baris Excel terbaca (tanpa 'Belum dapat dipetakan'): " . count($rows) . "\n\n";

// ---------------------------------------------------------------------------
// Validasi silang: semua indikator_excel harus ada di DB (kecuali yang dibuang)
// ---------------------------------------------------------------------------
$dbIndikators = DB::table('indikators')->get()->keyBy('nama_indikator');
$missing = [];
foreach ($rows as $row) {
    if (!isset($dbIndikators[$row['indikator_db']])) $missing[$row['indikator_db']] = true;
}
if ($missing) {
    echo "!! INDIKATOR EXCEL TIDAK ADA DI DB:\n";
    foreach (array_keys($missing) as $m) echo "   - $m\n";
    exit(1);
}
// OPD check
foreach ($rows as $row) {
    $k = kodeOpd($row['opd_raw']);
    if (!isset($opdBaru[$k])) {
        echo "!! OPD TIDAK DIKENAL: '{$row['opd_raw']}' (kode '$k')\n";
        exit(1);
    }
}
echo "Validasi silang OK.\n\n";

if (!$DRY_RUN) {
    DB::beginTransaction();
}

try {
    // -----------------------------------------------------------------------
    // 1. Bersihkan data lama
    // -----------------------------------------------------------------------
    echo "1. Membersihkan data lama...\n";
    $counts = [
        'ai_analyses' => DB::table('ai_analyses')->count(),
        'renaksi_programs' => DB::table('renaksi_programs')->count(),
        'target_capaians' => DB::table('target_capaians')->count(),
        'indikator_opd' => DB::table('indikator_opd')->count(),
    ];
    foreach ($counts as $t => $c) echo "   $t: $c baris akan dihapus\n";

    if (!$DRY_RUN) {
        DB::table('ai_analyses')->delete();
        DB::table('renaksi_programs')->delete();
        DB::table('target_capaians')->delete();
        DB::table('indikator_opd')->delete();
    }

    // -----------------------------------------------------------------------
    // 2. Rebuild OPD: hapus semua, buat 17 baru
    // -----------------------------------------------------------------------
    echo "\n2. Rebuild OPD (17 dinas)...\n";
    // User admin_opd yang OPD-nya dihapus ikut dibersihkan (keputusan user)
    $adminOpdCount = DB::table('users')->where('role', 'admin_opd')->count();
    echo "   users role admin_opd: $adminOpdCount akan dihapus\n";
    if (!$DRY_RUN) {
        DB::table('users')->where('role', 'admin_opd')->delete();
        DB::table('opds')->delete();
    }

    $opdIdMap = []; // kode -> id baru
    foreach ($opdBaru as $kode => [$kodeOpd, $namaOpd]) {
        if (!$DRY_RUN) {
            $id = DB::table('opds')->insertGetId([
                'kode_opd' => $kodeOpd,
                'nama_opd' => $namaOpd,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $opdIdMap[$kode] = $id;
        } else {
            $opdIdMap[$kode] = -1;
        }
        echo "   [$kodeOpd] $namaOpd\n";
    }

    // -----------------------------------------------------------------------
    // 3. Update indikator: kode I-xx, satuan inferensi
    // -----------------------------------------------------------------------
    echo "\n3. Update kode indikator (I-01..I-30) + satuan...\n";
    foreach (DB::table('indikators')->orderBy('no_urut')->get() as $ind) {
        $kodeBaru = 'I-' . str_pad($ind->no_urut, 2, '0', STR_PAD_LEFT);
        $satuan = $satuanIndikator[$ind->nama_indikator] ?? null;
        echo "   {$ind->kode} -> $kodeBaru | {$ind->nama_indikator}" . ($satuan ? " | satuan: $satuan" : " | (tanpa satuan)") . "\n";
        if (!$DRY_RUN) {
            DB::table('indikators')->where('id', $ind->id)->update([
                'kode' => $kodeBaru,
                'satuan' => $satuan ?? '',
                'updated_at' => now(),
            ]);
        }
    }

    // -----------------------------------------------------------------------
    // 4. Target capaian indikator (2025)
    // -----------------------------------------------------------------------
    echo "\n4. Isi target_capaians 2025...\n";
    $indikatorTargetDone = [];
    foreach ($rows as $row) {
        $nama = $row['indikator_db'];
        if (isset($indikatorTargetDone[$nama])) continue; // sekali per indikator
        $indikatorTargetDone[$nama] = true;

        $ind = $dbIndikators[$nama];
        [$target, $capaian, $ket] = parseTargetIndikator($nama, $row['target_ind'], $row['realisasi_ind']);
        $gap = ($target !== null && $capaian !== null) ? round($capaian - $target, 2) : null;
        $pctGap = ($target) ? round($gap / $target, 4) : null;

        echo "   {$ind->kode}: target=" . var_export($target, true) . " capaian=" . var_export($capaian, true) . ($ket ? " ($ket)" : '') . "\n";
        if (!$DRY_RUN) {
            DB::table('target_capaians')->insert([
                'indikator_id' => $ind->id,
                'tahun' => $TAHUN,
                'target' => $target,
                'capaian' => $capaian,
                'gap' => $gap,
                'pct_gap' => $pctGap,
                'status_tl' => 'Belum Diisi', // di-recalc di bawah
                'warna_tl' => 'Abu',
                'keterangan' => $ket,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    // -----------------------------------------------------------------------
    // 5. Rebuild pivot indikator_opd + opd utama indikator dari renaksi
    // -----------------------------------------------------------------------
    echo "\n5. Rebuild pivot indikator_opd + opd_id indikator...\n";
    $indOpds = []; // indikator_db nama -> [kode opd => true]
    foreach ($rows as $row) {
        $indOpds[$row['indikator_db']][kodeOpd($row['opd_raw'])] = true;
    }
    foreach ($indOpds as $nama => $kodeSet) {
        $ind = $dbIndikators[$nama];
        $kodes = array_keys($kodeSet);
        echo "   {$ind->kode} " . implode(', ', $kodes) . "\n";
        if (!$DRY_RUN) {
            $firstId = null;
            foreach ($kodes as $k) {
                DB::table('indikator_opd')->insert([
                    'indikator_id' => $ind->id,
                    'opd_id' => $opdIdMap[$k],
                ]);
                if ($firstId === null) $firstId = $opdIdMap[$k];
            }
            DB::table('indikators')->where('id', $ind->id)->update(['opd_id' => $firstId, 'updated_at' => now()]);
        }
    }

    // -----------------------------------------------------------------------
    // 6. Insert renaksi_programs
    // -----------------------------------------------------------------------
    echo "\n6. Insert renaksi_programs...\n";
    $no = 0;
    $statJenis = ['kuantitatif' => 0, 'kualitatif' => 0];
    foreach ($rows as $row) {
        $no++;
        $ind = $dbIndikators[$row['indikator_db']];
        [$jenisT, $tNilai, $tSatuan, $tTeks] = parseNilaiRenaksi($row['target_ren']);
        [$jenisR, $rNilai, $rSatuan, $rTeks] = parseNilaiRenaksi($row['realisasi_ren']);
        $jenis = ($jenisT === 'kuantitatif') ? 'kuantitatif' : 'kualitatif';
        $statJenis[$jenis]++;
        if (!$DRY_RUN) {
            DB::table('renaksi_programs')->insert([
                'no' => $no,
                'tahun' => $TAHUN,
                'dinas_text' => $row['opd_raw'],
                'opd_id' => $opdIdMap[kodeOpd($row['opd_raw'])],
                'kode_program' => null,
                'program' => null,
                'rencana_aksi' => $row['renaksi'],
                'target' => $tTeks,
                'realisasi' => $rTeks,
                'jenis_target' => $jenis,
                'target_nilai' => $tNilai,
                'target_satuan' => $tSatuan ?? $rSatuan,
                'realisasi_nilai' => $rNilai,
                'kendala' => null,
                'catatan' => $row['catatan'] !== '' ? $row['catatan'] : null,
                'indikator_1_id' => $ind->id,
                'status' => mapStatus($row['status']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
    echo "   $no renaksi diinsert (kuantitatif: {$statJenis['kuantitatif']}, kualitatif: {$statJenis['kualitatif']})\n";

    // -----------------------------------------------------------------------
    // 7. Recalc status_tl semua target_capaians pakai service yang sama
    // -----------------------------------------------------------------------
    echo "\n7. Recalc status_tl via DashboardService...\n";
    if (!$DRY_RUN) {
        $svc = app(App\Services\DashboardService::class);
        $n = $svc->recalculateAllStatus();
        echo "   $n baris diperbarui\n";
    } else {
        echo "   (dry-run: dilewati)\n";
    }

    if (!$DRY_RUN) {
        DB::commit();
        echo "\n=== COMMIT BERHASIL ===\n";
    } else {
        echo "\n=== DRY RUN SELESAI (tidak ada perubahan) ===\n";
    }
} catch (\Throwable $e) {
    if (!$DRY_RUN) DB::rollBack();
    echo "\n!!! ERROR: {$e->getMessage()}\n{$e->getTraceAsString()}\n";
    exit(1);
}
