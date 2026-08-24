<?php

/**
 * Sinkronisasi tautan indikator (indikator_1..4_id) renaksi_programs
 * persis mengikuti kolom H-M sheet "AksiKegiatan OPD" di Pilar Indikator.xlsx.
 * Pencocokan: teks rencana_aksi (dinormalisasi) — BUKAN urutan baris.
 *
 * Jalankan: C:\xampp\php\php.exe artisan tinker storage/sync-indikator-excel.php
 * Argumen "apply" untuk benar-benar menulis (default: dry-run).
 */

use App\Models\Indikator;
use App\Models\RenaksiProgram;
use PhpOffice\PhpSpreadsheet\IOFactory;

$apply = getenv('SYNC_APPLY') === '1' || in_array('apply', $argv ?? []);

$norm = fn(string $s) => preg_replace('/\s+/', ' ', mb_strtolower(trim($s)));

$ss = IOFactory::load('C:/Arip/STIESIA/Data PJPK/Pilar Indikator.xlsx');
$s2 = $ss->getSheet(1);

$petaIndikator = Indikator::all()->keyBy(fn($i) => mb_strtolower(trim($i->nama_indikator)));

$alias = [
    'pdrb per kapita' => 'produk domestik regional bruto (pdrb) perkapita',
    'asfr 15-19 tahun' => 'age-specific fertility rate (asfr) 15-19 tahun',
    'apk pendidikan tinggi' => 'angka partisipasi kasar (apk) perguruan tinggi (%)',
    'tpak perempuan' => 'tingkat partisipasi angkatan kerja perempuan',
    'penyandang disabilitas bekerja' => 'persentase penyandang disabilitas bekerja di sektor formal',
    'pengangguran terbuka' => 'tingkat pengangguran terbuka',
    'kepesertaan jkn' => 'cakupan kepesertaan jaminan kesehatan nasional (%)',
    'rt sanitasi aman' => 'rumah tangga dengan akses sanitasi aman (%)',
    'indeks pengasuhan remaja' => 'indeks pengasuhan keluarga yang memiliki remaja',
    'indeks pembangunan keluarga (i-bangga)' => 'indeks pembangunan keluarga (i-bangga)',
    'rata-rata lama sekolah' => '@prefix:rata-rata lama sekolah',
    'rt dengan akses hunian layak, terjangkau, dan berkelanjutan (%)' => '@prefix:rumah tangga dengan akses hunian layak',
    // Nilai Excel yang tidak ada padanan persis di tabel indikators (disepakati):
    'administrasi kependudukan' => '@multi:112,113,114,115', // 4 indikator Pilar 5 (akta kelahiran/cerai/nikah/kematian)
    'persentase pekerja lulusan pendidikan menengah dan tinggi yang bekerja di bidang keahlian menengah tinggi' => '@id:91',
    'proporsi penduduk berusia 15 tahun ke atas yang berkualifikasi pendidikan tinggi' => '@id:91',
];

// Mengembalikan array id (satu nilai Excel bisa memetakan ke >1 indikator)
$resolveIds = function (string $val) use ($petaIndikator, $alias): array {
    $k = mb_strtolower(trim($val));
    if ($k === '') return [];
    if (isset($alias[$k])) {
        $a = $alias[$k];
        if (str_starts_with($a, '@multi:')) {
            return array_map('intval', explode(',', substr($a, 7)));
        }
        if (str_starts_with($a, '@id:')) {
            return [(int) substr($a, 4)];
        }
        if (str_starts_with($a, '@prefix:')) {
            $prefix = substr($a, 8);
            $found = $petaIndikator->first(fn($v, $key) => str_starts_with($key, $prefix));
            return $found ? [$found->id] : [];
        }
        return $petaIndikator->has($a) ? [$petaIndikator->get($a)->id] : [];
    }
    if ($petaIndikator->has($k)) return [$petaIndikator->get($k)->id];
    $found = $petaIndikator->first(fn($v, $key) => str_starts_with($key, $k) || str_starts_with($k, $key));
    return $found ? [$found->id] : [];
};

// Kumpulkan baris Excel, dikelompokkan per rencana_aksi ternormalisasi
$excelByKey = [];
for ($r = 2; $r <= $s2->getHighestRow(); $r++) {
    $rencana = trim((string) $s2->getCell('C' . $r)->getValue());
    if ($rencana === '') continue;
    $indikatorExcel = [];
    foreach (range('H', 'M') as $col) {
        $v = trim((string) $s2->getCell($col . $r)->getValue());
        if ($v !== '') $indikatorExcel[] = $v;
    }
    $excelByKey[$norm($rencana)][] = ['row' => $r, 'indikator_excel' => $indikatorExcel];
}

$gagalMatch = [];
$berubah = 0;
$sama = 0;
$tidakAdaDiExcel = [];
$duplikatExcel = [];

foreach (RenaksiProgram::orderBy('no')->get() as $db) {
    $key = $norm($db->rencana_aksi);

    if (!isset($excelByKey[$key])) {
        // Coba cocokkan longgar: salah satu mengandung yang lain
        $ketemu = null;
        foreach ($excelByKey as $k => $rows) {
            if ($key !== '' && (str_contains($k, $key) || str_contains($key, $k))) { $ketemu = $k; break; }
        }
        if ($ketemu === null) {
            $tidakAdaDiExcel[] = "no {$db->no} [{$db->dinas_text}] " . mb_substr($db->rencana_aksi, 0, 60);
            continue;
        }
        $key = $ketemu;
    }

    $candidates = $excelByKey[$key];
    if (count($candidates) > 1) {
        $duplikatExcel[] = "no {$db->no} [{$db->rencana_aksi}] — " . count($candidates) . ' baris Excel, dipakai baris ' . $candidates[0]['row'];
    }
    $ex = $candidates[0];

    $idsBaru = [];
    foreach ($ex['indikator_excel'] as $val) {
        $ids = $resolveIds($val);
        if (empty($ids)) {
            $gagalMatch[$val] = ($gagalMatch[$val] ?? 0) + 1;
            continue;
        }
        foreach ($ids as $id) {
            if (!in_array($id, $idsBaru, true)) $idsBaru[] = $id;
        }
    }
    $idsBaru = array_slice($idsBaru, 0, 4);

    if ($db->indikator_id_list === $idsBaru) { $sama++; continue; }

    $berubah++;
    if ($berubah <= 10) {
        echo "UBAH no {$db->no} [" . mb_substr($db->rencana_aksi, 0, 45) . "]\n";
        echo '  lama: ' . json_encode($db->indikator_list, JSON_UNESCAPED_UNICODE) . "\n";
        echo '  baru: ' . json_encode(array_map(fn($id) => Indikator::find($id)?->nama_indikator, $idsBaru), JSON_UNESCAPED_UNICODE) . "\n";
    }
    if ($apply) {
        $db->update([
            'indikator_1_id' => $idsBaru[0] ?? null,
            'indikator_2_id' => $idsBaru[1] ?? null,
            'indikator_3_id' => $idsBaru[2] ?? null,
            'indikator_4_id' => $idsBaru[3] ?? null,
        ]);
    }
}

echo "\n" . ($apply ? 'MODE APPLY' : 'MODE DRY-RUN') . "\n";
echo "Berubah: {$berubah} | Sudah sama: {$sama} | Tidak ada di Excel: " . count($tidakAdaDiExcel) . "\n\n";

if ($gagalMatch) {
    echo 'NILAI EXCEL TANPA PADANAN DI DB (' . count($gagalMatch) . " unik):\n";
    foreach ($gagalMatch as $v => $n) echo "  ({$n}x) {$v}\n";
    echo "\n";
}
if ($tidakAdaDiExcel) {
    echo 'RENAAKSI DB TANPA PADANAN DI EXCEL (' . count($tidakAdaDiExcel) . "):\n";
    foreach ($tidakAdaDiExcel as $m) echo "  {$m}\n";
    echo "\n";
}
if ($duplikatExcel) {
    echo 'DUPLIKAT DI EXCEL (' . count($duplikatExcel) . "):\n";
    foreach ($duplikatExcel as $m) echo "  {$m}\n";
}
