<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DbSeedDummy extends Command
{
    protected $signature = 'db:seed-dummy';
    protected $description = 'Isi database dengan data dummy yang realistis';

    public function handle(): int
    {
        $this->newLine();
        $this->warn('⚠️  Pastikan Anda sudah menjalankan: php artisan db:backup');
        $this->warn('   untuk membuat backup sebelum seeding.');
        $this->newLine();

        if (!$this->confirm('Lanjutkan seeding data dummy?', false)) {
            $this->info('❌ Dibatalkan.');
            return 1;
        }

        $this->newLine();
        $this->call('db:seed', ['--class' => 'Database\\Seeders\\DummyDataSeeder']);

        $this->newLine();
        $this->info('💾 Backup tersimpan di: database/seeders/sql/backup_before_dummy.sql');
        $this->info('🔁 Untuk restore: php artisan db:restore');

        return 0;
    }
}
