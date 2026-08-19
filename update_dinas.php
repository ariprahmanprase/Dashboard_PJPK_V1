<?php
require_once __DIR__ . '/backend/vendor/autoload.php';
require_once __DIR__ . '/backend/bootstrap/app.php';

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

$inputFile = 'E:\Arip\PJPK\Renaksi - Rapi_Rapih.xlsx';

try {
    $spreadsheet = IOFactory::load($inputFile);
    $sheet = $spreadsheet->getActiveSheet();
    $highestRow = $sheet->getHighestRow();

    echo "Updating dinas_text for existing records...\n";

    $updated = 0;

    // Start from row 2 (skip header)
    for ($row = 2; $row <= $highestRow; $row++) {
        $dinas = trim((string)$sheet->getCell('A' . $row)->getValue() ?? '');
        $rencanaAksi = trim((string)$sheet->getCell('D' . $row)->getValue() ?? '');

        // Skip if row is empty
        if (empty($dinas) && empty($rencanaAksi)) {
            continue;
        }

        // Get no from row
        $no = $row - 1;

        // Update database
        DB::table('renaksi_programs')
            ->where('no', $no)
            ->update(['dinas_text' => $dinas]);

        $updated++;
    }

    echo "✅ Update selesai! Updated: $updated rows\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
