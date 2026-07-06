<?php

namespace App\Console\Commands;

use App\Services\ExcelImportService;
use Illuminate\Console\Command;

class ImportExcelCommand extends Command
{
    protected $signature = 'import:excel {file?}';
    protected $description = 'Import data from PJPK V1.xlsx to MySQL';

    public function handle(ExcelImportService $service): int
    {
        $file = $this->argument('file') ?? 'C:/xampp/htdocs/PJPK_V1_Dashboard/PJPK V1.xlsx';

        if (!file_exists($file)) {
            $this->error("File not found: $file");
            return 1;
        }

        $this->info("Importing from: $file");

        try {
            $result = $service->import($file);
            $this->table(['Table', 'Count'], [
                ['Pilar', $result['pilar']],
                ['OPD', $result['opd']],
                ['Indikator', $result['indikator']],
                ['Target & Capaian', $result['target_capaian']],
                ['Rencana Aksi', $result['renaksi']],
            ]);
            $this->newLine();
            $this->info('✅ Import BERHASIL!');
            return 0;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            $this->line($e->getTraceAsString());
            return 1;
        }
    }
}
