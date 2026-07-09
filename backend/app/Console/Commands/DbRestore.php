<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DbRestore extends Command
{
    protected $signature = 'db:restore';
    protected $description = 'Kembalikan database ke kondisi sebelum data dummy';

    public function handle(): int
    {
        $backupFile = database_path('seeders/sql/backup_before_dummy.sql');

        if (!file_exists($backupFile)) {
            $this->error('❌ File backup tidak ditemukan: ' . $backupFile);
            $this->info('   Jalankan "php artisan db:backup" terlebih dahulu sebelum seeding dummy.');
            return 1;
        }

        $this->newLine();
        $this->warn('⚠️  Ini akan MENGHAPUS semua data saat ini dan mengembalikan ke kondisi sebelum dummy!');
        $this->warn('   Semua perubahan setelah backup akan hilang.');

        if (!$this->confirm('Anda yakin ingin restore?', false)) {
            $this->info('❌ Dibatalkan.');
            return 1;
        }

        $this->newLine();
        $this->info('🔄 Merestore database dari backup...');

        try {
            DB::unprepared(file_get_contents($backupFile));
            $this->info('✅ Database berhasil dikembalikan ke kondisi sebelum data dummy!');
        } catch (\Exception $e) {
            $this->error('❌ Gagal restore: ' . $e->getMessage());
            $this->info('   Anda bisa restore manual via phpMyAdmin atau command line:');
            $this->info("   mysql -u root pjpk_dashboard < \"{$backupFile}\"");
            return 1;
        }

        return 0;
    }
}
