<?php

namespace App\Console\Commands;

use App\Models\RenaksiProgram;
use App\Models\Opd;
use App\Models\Indikator;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportRenaksiProgram extends Command
{
    protected $signature = 'import:renaksi-program {file : Path to Excel file}';
    protected $description = 'Import data renaksi program dari Excel';

    public function handle(): int
    {
        $filePath = $this->argument('file');

        if (!file_exists($filePath)) {
            $this->error("File tidak ditemukan: $filePath");
            return self::FAILURE;
        }

        $this->info('Memulai import data renaksi program...');

        try {
            $spreadsheet = IOFactory::load($filePath);
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();

            // Clear existing data
            RenaksiProgram::truncate();
            $this->info('Data lama berhasil dihapus.');

            // Get OPDs for matching
            $opdMap = [];
            Opd::all()->each(function ($opd) use (&$opdMap) {
                $opdMap[strtoupper(trim($opd->nama_opd))] = $opd->id;
            });

            // Get Indikators for matching
            $indikatorMap = [];
            Indikator::all()->each(function ($ind) use (&$indikatorMap) {
                $indikatorMap[strtoupper(trim($ind->nama_indikator))] = $ind->id;
            });

            $imported = 0;
            $skipped = 0;

            // Pattern untuk kode program
            $kodePattern = '/^(\d+\.\d+(?:\.\d+)?)\s+(.*)$/';

            // Start from row 2 (skip header)
            for ($row = 2; $row <= $highestRow; $row++) {
                $dinas = trim((string)$sheet->getCell('A' . $row)->getValue() ?? '');
                $kodeProgram = trim((string)$sheet->getCell('B' . $row)->getValue() ?? '');
                $program = trim((string)$sheet->getCell('C' . $row)->getValue() ?? '');
                $rencanaAksi = trim((string)$sheet->getCell('D' . $row)->getValue() ?? '');
                $target = trim((string)$sheet->getCell('E' . $row)->getValue() ?? '');
                $realisasi = trim((string)$sheet->getCell('F' . $row)->getValue() ?? '');
                $kendala = trim((string)$sheet->getCell('G' . $row)->getValue() ?? '');
                $catatan = trim((string)$sheet->getCell('H' . $row)->getValue() ?? '');
                $indikator1 = trim((string)$sheet->getCell('I' . $row)->getValue() ?? '');
                $indikator2 = trim((string)$sheet->getCell('J' . $row)->getValue() ?? '');
                $indikator3 = trim((string)$sheet->getCell('K' . $row)->getValue() ?? '');
                $indikator4 = trim((string)$sheet->getCell('L' . $row)->getValue() ?? '');

                // Skip if row is empty
                if (empty($dinas) && empty($rencanaAksi)) {
                    $skipped++;
                    continue;
                }

                // Extract kode from program if not in column B
                if (empty($kodeProgram) && preg_match($kodePattern, $program, $matches)) {
                    $kodeProgram = $matches[1];
                    $program = $matches[2];
                }

                // Match OPD
                $opdId = null;
                foreach ($opdMap as $nama => $id) {
                    // Check if dinas contains OPD name or vice versa
                    if (stripos($dinas, str_replace('(', '', $nama)) !== false ||
                        stripos(str_replace('(', '', $nama), $dinas) !== false) {
                        $opdId = $id;
                        break;
                    }
                    // Partial match
                    $dinasWords = explode(' ', $dinas);
                    foreach ($dinasWords as $word) {
                        if (strlen($word) > 3 && stripos($nama, $word) !== false) {
                            $opdId = $id;
                            break 2;
                        }
                    }
                }

                // Match Indikators
                $indikator1Id = $this->matchIndikator($indikator1, $indikatorMap);
                $indikator2Id = $this->matchIndikator($indikator2, $indikatorMap);
                $indikator3Id = $this->matchIndikator($indikator3, $indikatorMap);
                $indikator4Id = $this->matchIndikator($indikator4, $indikatorMap);

                // Determine status from catatan/realisasi
                $status = 'Terlaksana';
                if (!empty($catatan) && (
                    stripos($catatan, 'belum') !== false ||
                    stripos($catatan, 'tidak') !== false ||
                    stripos($catatan, 'pending') !== false ||
                    stripos($catatan, 'gagal') !== false
                )) {
                    $status = 'Tidak Terlaksana';
                } elseif (!empty($realisasi) && (
                    stripos($realisasi, '0') === 0 ||
                    stripos($realisasi, '-') === 0 ||
                    stripos($realisasi, 'belum') !== false
                )) {
                    $status = 'Tidak Terlaksana';
                }

                RenaksiProgram::create([
                    'no' => $row - 1,
                    'dinas_text' => !empty($dinas) ? $dinas : '-',
                    'opd_id' => $opdId,
                    'kode_program' => !empty($kodeProgram) ? $kodeProgram : '-',
                    'program' => $program,
                    'rencana_aksi' => $rencanaAksi,
                    'target' => !empty($target) ? $target : '-',
                    'realisasi' => !empty($realisasi) ? $realisasi : '-',
                    'kendala' => !empty($kendala) && $kendala !== '-' ? $kendala : null,
                    'catatan' => !empty($catatan) && $catatan !== '-' ? $catatan : null,
                    'indikator_1_id' => $indikator1Id,
                    'indikator_2_id' => $indikator2Id,
                    'indikator_3_id' => $indikator3Id,
                    'indikator_4_id' => $indikator4Id,
                    'status' => $status,
                ]);

                $imported++;
            }

            $this->info("✅ Import berhasil!");
            $this->info("   - Data diimport: $imported baris");
            $this->info("   - Dilewati (kosong): $skipped baris");

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function matchIndikator(string $nama, array $map): ?int
    {
        if (empty(trim($nama))) {
            return null;
        }

        $namaUpper = strtoupper(trim($nama));

        // Exact match
        if (isset($map[$namaUpper])) {
            return $map[$namaUpper];
        }

        // Partial match - check if indicator name contains the search term
        foreach ($map as $indikatorNama => $id) {
            // Check if indicator name contains our search term
            if (stripos($indikatorNama, $namaUpper) !== false ||
                stripos($namaUpper, $indikatorNama) !== false) {
                return $id;
            }
        }

        return null;
    }
}
