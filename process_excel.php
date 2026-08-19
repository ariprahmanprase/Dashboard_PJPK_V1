<?php
require_once __DIR__ . '/backend/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$inputFile = 'E:\Arip\PJPK\Renaksi - Rapi.xlsx';
$outputFile = 'E:\Arip\PJPK\Renaksi - Rapi_Rapih.xlsx';

try {
    $spreadsheet = IOFactory::load($inputFile);
    $sheet = $spreadsheet->getActiveSheet();

    $highestRow = $sheet->getHighestRow();
    echo "Processing $highestRow rows...\n\n";

    $updated = 0;
    $skipped = 0;

    // Pattern untuk menangkap kode program seperti "2.18.04", "1.01.02", dll
    // Format: angka.angka.angka di awal teks
    $pattern = '/^(\d+\.\d+(?:\.\d+)?)\s+(.*)$/';

    for ($row = 2; $row <= $highestRow; $row++) {
        $dinas = $sheet->getCell('A' . $row)->getValue();

        // Skip jika baris kosong atau header
        if (empty($dinas) || $dinas === 'DINAS') {
            continue;
        }

        $program = $sheet->getCell('C' . $row)->getValue();
        $existingKode = $sheet->getCell('B' . $row)->getValue();

        if (!empty($program)) {
            $programStr = trim((string)$program);

            // Cari pattern kode di awal program
            if (preg_match($pattern, $programStr, $matches)) {
                $kode = $matches[1];
                $namaProgram = trim($matches[2]);

                // Update kolom Kode (B) dan Program (C)
                $sheet->setCellValue('B' . $row, $kode);
                $sheet->setCellValue('C' . $row, $namaProgram);
                $updated++;
            } else {
                // Tidak ada kode, isi dengan "-"
                if (empty($existingKode)) {
                    $sheet->setCellValue('B' . $row, '-');
                }
                $skipped++;
            }
        }
    }

    // Save ke file baru
    $writer = new Xlsx($spreadsheet);
    $writer->save($outputFile);

    echo "✅ Selesai!\n";
    echo "   - Updated: $updated baris\n";
    echo "   - No code (filled with '-'): $skipped baris\n";
    echo "   - Output: $outputFile\n";

    // Preview hasil
    echo "\n=== PREVIEW HASIL ===\n";
    $newSpreadsheet = IOFactory::load($outputFile);
    $newSheet = $newSpreadsheet->getActiveSheet();

    for ($row = 1; $row <= 15; $row++) {
        $dinas = $newSheet->getCell('A' . $row)->getValue();
        $kode = $newSheet->getCell('B' . $row)->getValue();
        $program = $newSheet->getCell('C' . $row)->getValue();
        $rencanaAksi = $newSheet->getCell('D' . $row)->getValue();

        $dinas = $dinas !== null ? substr((string)$dinas, 0, 15) : '';
        $kode = $kode !== null ? substr((string)$kode, 0, 10) : '';
        $program = $program !== null ? substr((string)$program, 0, 45) : '';

        echo "Row $row: [$dinas] | [$kode] | [$program]\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
