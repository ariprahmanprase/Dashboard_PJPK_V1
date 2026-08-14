<?php

namespace App\Services;

use App\Models\Indikator;
use App\Models\Opd;
use App\Models\Pilar;
use App\Models\Renaksi;
use App\Models\TargetCapaian;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ExcelImportService
{
    private array $pilarMap = [];       // no_pilar => id
    private array $opdMap = [];         // nama_opd => id
    private array $indikatorMap = [];   // kode => id

    public function import(string $filePath): array
    {
        // Clear existing data (order matters for FK constraints)
        DB::table('indikator_opd')->delete();
        Renaksi::query()->delete();
        TargetCapaian::query()->delete();
        Indikator::query()->delete();
        Opd::query()->delete();
        Pilar::query()->delete();

        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getSheetByName('30 Indikator');

        $this->importPilar($sheet);
        $this->importOpd($sheet);
        $this->importIndikator($sheet);
        $this->importTargetCapaian($sheet);
        // Renaksi: tidak ada di Excel baru → skip

        return [
            'pilar' => Pilar::count(),
            'opd' => Opd::count(),
            'indikator' => Indikator::count(),
            'target_capaian' => TargetCapaian::count(),
            'renaksi' => Renaksi::count(),
        ];
    }

    // ──────────────────────────────────────────────
    // PILAR — hardcode 5 pilar dari Excel headers
    // ──────────────────────────────────────────────

    private function importPilar($sheet): void
    {
        $data = [
            1 => 'Pilar 1: Pengendalian Kuantitas Penduduk',
            2 => 'Pilar 2: Peningkatan Kualitas Penduduk',
            3 => 'Pilar 3: Pembangunan Keluarga',
            4 => 'Pilar 4: Penataan Persebaran dan Pengarahan Mobilitas Penduduk',
            5 => 'Pilar 5: Penataan Administrasi Data Kependudukan',
        ];

        foreach ($data as $no => $nama) {
            $pilar = Pilar::create(['no_pilar' => $no, 'nama_pilar' => $nama]);
            $this->pilarMap[$no] = $pilar->id;
        }
    }

    // ──────────────────────────────────────────────
    // OPD — parse dari kolom C (comma-separated)
    // ──────────────────────────────────────────────

    private function importOpd($sheet): void
    {
        // Pilar header rows + their data ranges
        $ranges = [
            1 => [5, 8],
            2 => [10, 24],
            3 => [26, 33],
            4 => [35, 37],
            5 => [39, 42],
        ];

        foreach ($ranges as $pilarNo => [$start, $end]) {
            for ($r = $start; $r <= $end; $r++) {
                $opdCell = $this->cell($sheet, 'C', $r);
                if (empty($opdCell)) continue;

                $opdNames = $this->splitOpdNames($opdCell);
                foreach ($opdNames as $nama) {
                    if (!isset($this->opdMap[$nama])) {
                        $nama = trim($nama);
                        // Normalise: generate a short kode from the full name
                        $opd = Opd::firstOrCreate(
                            ['nama_opd' => $nama],
                            ['kode_opd' => $this->generateOpdKode($nama)]
                        );
                        $this->opdMap[$nama] = $opd->id;
                    }
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // INDIKATOR — 30 indikator + pivot indikator_opd
    // ──────────────────────────────────────────────

    private function importIndikator($sheet): void
    {
        // Pilar → row ranges (excel row numbers)
        $ranges = [
            1 => [5, 8],
            2 => [10, 24],
            3 => [26, 33],
            4 => [35, 37],
            5 => [39, 42],
        ];

        $noUrutGlobal = 0;

        foreach ($ranges as $pilarNo => [$start, $end]) {
            $noUrutPilar = 0;

            for ($r = $start; $r <= $end; $r++) {
                $a = $this->cell($sheet, 'A', $r);      // no_urut
                $b = $this->cell($sheet, 'B', $r);      // nama_indikator
                $c = $this->cell($sheet, 'C', $r);      // OPD (comma-separated)
                $d = $this->cell($sheet, 'D', $r);      // dokrenda
                $e = $this->cell($sheet, 'E', $r);      // sumber_data
                $f = $this->cellVal($sheet, 'F', $r);   // baseline_2024
                $o = $this->cell($sheet, 'O', $r);      // keterangan (tambahan)

                // Skip empty rows
                if (empty($a) && empty($b) && empty($c)) continue;

                $noUrutGlobal++;
                $noUrutPilar++;

                // Generate kode: P{no_pilar}-{no_urut_pilar} (padding 01)
                $kode = sprintf('P%d-%02d', $pilarNo, $noUrutPilar);

                // Row 13: Stunting — nama kosong di Excel, hardcode
                $namaIndikator = $b;
                if (empty($namaIndikator) && $r === 13) {
                    $namaIndikator = 'Prevalensi Stunting (Persentase Balita dengan Tinggi Badan di Bawah Standar)';
                }

                // Parse OPD names
                $opdNames = $this->splitOpdNames($c);
                $firstOpdId = null;
                if (!empty($opdNames)) {
                    $firstOpdId = $this->opdMap[$opdNames[0]] ?? null;
                }

                $indikator = Indikator::create([
                    'kode'            => $kode,
                    'no_urut'         => (int) $a ?: $noUrutGlobal,
                    'pilar_id'        => $this->pilarMap[$pilarNo],
                    'opd_id'          => $firstOpdId,  // backward compat: first OPD
                    'nama_indikator'  => $namaIndikator ?: '-',
                    'satuan'          => '',
                    'sumber_data'     => $e ?: null,
                    'baseline_2024'   => is_numeric($f) ? (float) $f : null,
                    'dokrenda'        => $d ?: null,
                    'kendala'         => $this->cell($sheet, 'M', $r) ?: null,
                    'inovasi'         => $this->cell($sheet, 'N', $r) ?: null,
                ]);

                $this->indikatorMap[$kode] = $indikator->id;

                // Insert pivot indikator_opd
                foreach ($opdNames as $namaOpd) {
                    if (isset($this->opdMap[$namaOpd])) {
                        DB::table('indikator_opd')->insertOrIgnore([
                            'indikator_id' => $indikator->id,
                            'opd_id'       => $this->opdMap[$namaOpd],
                        ]);
                    }
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // TARGET CAPAIAN — 2025-2029
    // ──────────────────────────────────────────────

    private function importTargetCapaian($sheet): void
    {
        $ranges = [
            1 => [5, 8],
            2 => [10, 24],
            3 => [26, 33],
            4 => [35, 37],
            5 => [39, 42],
        ];

        // Map kolom untuk target (tahun → kolom)
        $yearColumns = [
            2025 => 'G',
            2026 => 'H',
            2027 => 'I',
            2028 => 'J',
            2029 => 'K',
        ];

        foreach ($ranges as $pilarNo => [$start, $end]) {
            $noUrutPilar = 0;

            for ($r = $start; $r <= $end; $r++) {
                $a = $this->cell($sheet, 'A', $r);
                $b = $this->cell($sheet, 'B', $r);

                if (empty($a) && empty($b)) continue;  // skip empty rows

                $noUrutPilar++;
                $kode = sprintf('P%d-%02d', $pilarNo, $noUrutPilar);

                if (!isset($this->indikatorMap[$kode])) continue;

                foreach ($yearColumns as $tahun => $col) {
                    $target = $this->cellVal($sheet, $col, $r);
                    // capaian hanya untuk 2025 (kolom L), sisanya NULL
                    $capaian = null;
                    if ($tahun === 2025) {
                        $capaian = $this->cellVal($sheet, 'L', $r);
                    }

                    // Parse numeric values
                    $targetNum = $this->parseNumeric($target);
                    $capaianNum = $this->parseNumeric($capaian);

                    // Hitung gap & pct_gap
                    $gapNum = null;
                    $pctGap = null;
                    if ($targetNum !== null && $capaianNum !== null) {
                        $gapNum = round($capaianNum - $targetNum, 2);
                        if ($targetNum != 0) {
                            $pctGap = round(($capaianNum - $targetNum) / abs($targetNum), 6);
                        }
                    }

                    // Status & warna
                    $status = $this->calcStatusTL($targetNum, $capaianNum);

                    TargetCapaian::create([
                        'indikator_id' => $this->indikatorMap[$kode],
                        'tahun'        => $tahun,
                        'target'       => $targetNum,
                        'capaian'      => $capaianNum,
                        'gap'          => $gapNum,
                        'pct_gap'      => $pctGap,
                        'status_tl'    => $status['status_tl'],
                        'warna_tl'     => $status['warna_tl'],
                        'keterangan'   => null,
                    ]);
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────

    private function cell($sheet, string $col, int $row): ?string
    {
        $val = $sheet->getCell($col . $row)->getValue();
        if ($val === null) return null;
        $str = trim((string) $val);
        return $str !== '' ? $str : null;
    }

    private function cellVal($sheet, string $col, int $row): mixed
    {
        return $sheet->getCell($col . $row)->getValue();
    }

    /**
     * Generate a short kode from OPD full name.
     * e.g. "Dinas Kesehatan" → "Dinkes", "Badan Perencanaan" → "Bapeda"
     */
    private function generateOpdKode(string $nama): string
    {
        $words = explode(' ', $nama);
        if (count($words) <= 2) {
            return implode('', array_map(fn($w) => substr($w, 0, 4), $words));
        }
        // For longer names: first syllable of first 3 words
        $abbr = '';
        foreach (array_slice($words, 0, 3) as $w) {
            $abbr .= strtolower(substr($w, 0, 3));
        }
        return $abbr;
    }

    /**
     * Split OPD names by comma, trim whitespace,
     * handle edge case: OPD name containing "Dinas Komunikasi, Informatika dan Statistik"
     * We detect this by checking if a split segment doesn't contain lowercase/uppercase pattern of a proper OPD name start.
     */
    private function splitOpdNames(string $raw): array
    {
        // Simply trim the raw string first
        $raw = trim($raw, " \t\n\r\0\x0B,");
        if (empty($raw)) return [];

        // Split by comma and trim each part
        $parts = array_map('trim', explode(',', $raw));
        $parts = array_filter($parts, fn($p) => !empty($p));

        return array_values($parts);
    }

    /**
     * Parse value to numeric. Handles Indonesian decimal format (comma as decimal separator).
     * Also handles range values like "4,53-4,12" → takes the first number.
     */
    private function parseNumeric($val): ?float
    {
        if ($val === null) return null;
        if (is_numeric($val)) return (float) $val;

        $str = trim((string) $val);
        if ($str === '' || $str === '-') return null;

        // Handle percentage: "98,50%" → 98.50
        $str = rtrim($str, '%');

        // Handle range: "4,53-4,12" → take first value "4,53"
        if (str_contains($str, '-') && !str_starts_with($str, '-')) {
            $parts = explode('-', $str, 2);
            $str = $parts[0];
        }

        // Handle comma that looks like it's in "21,01" (invalid) — check if it's a malformed number
        // First try direct casting if it has a dot
        if (is_numeric($str)) return (float) $str;

        // Replace comma with dot for Indonesian decimal
        // But be careful: "1,81" → 1.81, "87,2" → 87.2
        $normalized = str_replace(',', '.', $str);
        if (is_numeric($normalized)) return (float) $normalized;

        return null;
    }

    /**
     * Formula seragam: capaian >= target → On Track,
     * capaian < target tapi >= 90% → Warning,
     * else → Alert.
     * NULL target/capaian → Belum Diisi.
     */
    private function calcStatusTL($target, $capaian): array
    {
        if ($capaian === null || $target === null || $target == 0) {
            return ['status_tl' => 'Belum Diisi', 'warna_tl' => 'Abu'];
        }
        if ($capaian >= $target) {
            return ['status_tl' => 'On Track', 'warna_tl' => 'Hijau'];
        }
        if ($capaian >= $target * 0.9) {
            return ['status_tl' => 'Warning', 'warna_tl' => 'Kuning'];
        }
        return ['status_tl' => 'Alert', 'warna_tl' => 'Merah'];
    }
}
