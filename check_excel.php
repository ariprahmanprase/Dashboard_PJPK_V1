<?php
require_once __DIR__ . '/backend/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$inputFile = 'E:\Arip\PJPK\Renaksi - Rapi_Rapih.xlsx';

try {
    $spreadsheet = IOFactory::load($inputFile);
    $sheet = $spreadsheet->getActiveSheet();
    $highestRow = $sheet->getHighestRow();

    echo "Checking rows with empty OPD match:\n\n";

    $emptyRows = [3, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 60, 61, 62];

    foreach ($emptyRows as $rowNum) {
        $dinas = trim((string)$sheet->getCell('A' . $rowNum)->getValue() ?? '');
        $kode = trim((string)$sheet->getCell('B' . $rowNum)->getValue() ?? '');
        $program = trim((string)$sheet->getCell('C' . $rowNum)->getValue() ?? '');
        echo "Row $rowNum: Dinas='$dinas', Kode='$kode', Program='" . substr($program, 0, 50) . "...'\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
