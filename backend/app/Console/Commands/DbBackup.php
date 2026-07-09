<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class DbBackup extends Command
{
    protected $signature = 'db:backup';
    protected $description = 'Backup database ke file SQL';

    public function handle(): int
    {
        $backupFile = database_path('seeders/sql/backup_before_dummy.sql');
        $dbName = env('DB_DATABASE', 'pjpk_dashboard');
        $dbUser = env('DB_USERNAME', 'root');
        $dbPass = env('DB_PASSWORD', '');

        // Cari mysqldump
        $mysqldump = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
        if (!file_exists($mysqldump)) {
            // Fallback: coba cari di PATH
            $mysqldump = 'mysqldump';
        }

        $this->newLine();
        $this->info('💾 Mem-backup database: ' . $dbName);

        $passArg = $dbPass ? " -p{$dbPass}" : '';
        $command = "\"{$mysqldump}\" -u {$dbUser}{$passArg} {$dbName} --no-tablespaces --complete-insert";
        $process = Process::fromShellCommandline($command);
        $process->run();

        if ($process->isSuccessful()) {
            file_put_contents($backupFile, $process->getOutput());
            $size = round(filesize($backupFile) / 1024, 1);
            $this->info("✅ Backup berhasil disimpan ({$size} KB)");
            $this->info("   📁 {$backupFile}");
        } else {
            $this->error('❌ Backup gagal: ' . $process->getErrorOutput());
            return 1;
        }

        return 0;
    }
}
