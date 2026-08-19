<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Memilah kolom target & realisasi (teks bebas) di renaksi_programs menjadi
 * terstruktur: jenis_target, target_nilai, target_satuan, realisasi_nilai.
 *
 * - Kuantitatif: angka+satuan diekstrak ke kolom baru, teks target/realisasi
 *   dikosongkan, sisa keterangan/narasi dipindah ke kolom catatan.
 * - Kualitatif : teks target/realisasi dibiarkan apa adanya.
 *
 * Aman dijalankan berulang (idempotent): baris yang sudah terpilah akan
 * ditimpa dengan hasil yang sama.
 *
 * Jalankan: php artisan db:seed --class=PilahTargetRenaksiSeeder
 */
class PilahTargetRenaksiSeeder extends Seeder
{
    // Mapping manual 16 target ganda (disetujui): id => [nilai, satuan, ke_catatan]
    private array $ganda = [
        6  => [100,  'Orang',   '1x setahun'],
        7  => [120,  'Orang',   '1x setahun'],
        22 => [47.17,'%',       'Pelayanan air minum aman'],
        23 => [99.34,'%',       'Akses sanitasi layak'],
        24 => [99.93,'%',       'Luas tidak kumuh'],
        26 => [33,   'Unit',    '28 Mudik, 5 bus sekolah'],
        32 => [30,   'Peserta', '1x Pelatihan'],
        35 => [1450, 'Peserta', '20x pelatihan'],
        38 => [120,  'Orang',   '4 lokasi pelatihan'],
        39 => [280,  'Peserta', '7 lokasi pelatihan'],
        40 => [30,   'Orang',   '1 lokasi pelatihan'],
        41 => [50,   'Orang',   '2 lokasi pelatihan'],
        42 => [504,  'Orang',   '19 lokasi pelatihan'],
        43 => [586,  'Orang',   '28 lokasi pelatihan'],
        44 => [340,  'Orang',   '17 lokasi'],
        57 => [0.5,  'Ha',      null],
    ];

    // Override koreksi salah pilah & satuan khusus:
    // id => [jenis, target_nilai, target_satuan, realisasi_nilai, ke_catatan]
    private array $override = [
        2  => ['kualitatif', null, null, null, null],
        3  => ['kuantitatif', 21, 'Kegiatan', 21, null],
        12 => ['kuantitatif', 500, 'Orang', 100, null],
        31 => ['kuantitatif', 50, 'Pelampung', 50, '1x sosialisasi'],
        53 => ['kuantitatif', 400, 'Akta', 400, null],
        54 => ['kuantitatif', 59, 'Akta', 59, null],
        55 => ['kuantitatif', 19141, 'Akta', 19141, null],
        56 => ['kuantitatif', 31005, 'Akta', 31005, null],
        58 => ['kuantitatif', 31, 'Ha', 31, 'untuk 2026 menjadi 32 ha'],
    ];

    // Realisasi khusus untuk target ganda yang beda dari target
    private array $realisasiGanda = [
        22 => 46.81,
        23 => 99.48,
        24 => 99.99,
        26 => 28,
        39 => 275,
    ];

    private array $satuan = [
        '%', 'orang', 'peserta', 'kegiatan', 'paket', 'dokumen', 'laporan',
        'unit', 'kelompok', 'lokasi', 'lokus', 'desa', 'kecamatan', 'ha',
        'rupiah', 'benih', 'produk', 'nib', 'sekolah', 'pasar', 'petani',
        'kader', 'pelatihan', 'layanan', 'titik', 'rt rw', 'pelaku usaha',
        'akta', 'pelampung',
    ];

    public function run(): void
    {
        $rows = DB::table('renaksi_programs')->orderBy('id')->get();
        $kuan = 0;
        $kual = 0;

        foreach ($rows as $r) {
            [$jenis, $tNilai, $tSatuan, $rNilai, $catTambahan] = $this->pilah($r);

            $update = [
                'jenis_target'    => $jenis,
                'target_nilai'    => $tNilai,
                'target_satuan'   => $tSatuan,
                'realisasi_nilai' => $rNilai,
                'updated_at'      => now(),
            ];

            // Gabungkan sisa keterangan/narasi ke catatan
            if ($catTambahan !== null) {
                $existing = trim((string) $r->catatan);
                $update['catatan'] = $existing === '' ? $catTambahan : $existing . ' | ' . $catTambahan;
            }

            // Kuantitatif: kosongkan kolom teks (angka sudah di kolom baru)
            if ($jenis === 'kuantitatif') {
                // Narasi realisasi penting diselamatkan ke catatan dulu
                if ($rNilai === null && $r->realisasi && $r->realisasi !== '-' && mb_strlen($r->realisasi) > 10) {
                    $existing = $update['catatan'] ?? trim((string) $r->catatan);
                    $narasi = 'Realisasi: ' . $r->realisasi;
                    $update['catatan'] = $existing === '' ? $narasi : $existing . ' | ' . $narasi;
                }
                $update['target'] = null;
                $update['realisasi'] = null;
                $kuan++;
            } else {
                $kual++;
            }

            DB::table('renaksi_programs')->where('id', $r->id)->update($update);
        }

        $this->command->info("✅ Pilah target selesai: {$kuan} kuantitatif, {$kual} kualitatif.");
    }

    /**
     * Tentukan jenis + nilai terstruktur untuk satu baris.
     * Return [jenis, target_nilai, target_satuan, realisasi_nilai, cat_tambahan]
     */
    private function pilah($r): array
    {
        $id = $r->id;
        $target = trim((string) $r->target);
        $realisasi = trim((string) $r->realisasi);

        if (isset($this->override[$id])) {
            return $this->override[$id];
        }

        if (isset($this->ganda[$id])) {
            [$tNilai, $tSatuan, $cat] = $this->ganda[$id];
            $rNilai = $this->realisasiGanda[$id] ?? $tNilai;
            return ['kuantitatif', $tNilai, $tSatuan, $rNilai, $cat];
        }

        if ($target === '-' || $target === '') {
            return ['kualitatif', null, null, null, null];
        }

        // Deteksi otomatis: angka di depan + sisa teks pendek => kuantitatif
        $ex = $this->ekstrak($target);
        $sisa = trim(preg_replace('/^[\d\.,]+\s*[a-zA-Z% ]*/u', '', $target));

        if ($ex && mb_strlen($sisa) < 15) {
            [$tNilai, $tSatuan] = $ex;
            $rNilai = null;
            $realClean = trim(preg_replace('/[\d\.,]/', '', $realisasi));
            if (mb_strlen($realisasi) > 0 && mb_strlen($realisasi) < 25 && str_word_count($realisasi) <= 4) {
                $exr = $this->ekstrak($realisasi);
                if ($exr) {
                    $rNilai = $exr[0];
                }
            }
            return ['kuantitatif', $tNilai, $tSatuan, $rNilai, null];
        }

        return ['kualitatif', null, null, null, null];
    }

    /**
     * Ekstrak [nilai, satuan] dari teks. Return null jika tidak ada angka.
     */
    private function ekstrak(string $teks): ?array
    {
        if (!preg_match('/(\d[\d\.,]*)\s*([a-zA-Z% ]*)/u', trim($teks), $m)) {
            return null;
        }

        $nilai = $this->parseAngka($m[1]);
        if ($nilai === null) {
            return null;
        }

        $satMentah = strtolower(trim($m[2] ?? ''));
        $satuan = null;
        foreach ($this->satuan as $s) {
            if ($satMentah !== '' && strpos($satMentah, $s) === 0) {
                $satuan = ucwords($s);
                break;
            }
        }
        if ($satuan === null && strpos($satMentah, '%') !== false) {
            $satuan = '%';
        }

        return [$nilai, $satuan];
    }

    /**
     * Normalisasi angka Indonesia: "47,17"->47.17, "29.176"->29176.
     */
    private function parseAngka(string $s): ?float
    {
        $s = trim($s);
        if ($s === '') {
            return null;
        }
        if (preg_match('/^\d{1,3}(\.\d{3})+(,\d+)?$/', $s)) {
            $s = str_replace('.', '', $s);
            $s = str_replace(',', '.', $s);
        } elseif (strpos($s, ',') !== false) {
            $s = str_replace(',', '.', $s);
        }

        return is_numeric($s) ? (float) $s : null;
    }
}
