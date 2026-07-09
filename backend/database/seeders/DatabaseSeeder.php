<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Jalankan SQL dump data lengkap
        $sql = database_path('seeders/sql/pjpk_data.sql');

        if (file_exists($sql)) {
            DB::unprepared(file_get_contents($sql));
            $this->command->info('✅ Data PJPK berhasil di-import!');
        } else {
            $this->command->warn('⚠️  File SQL tidak ditemukan: ' . $sql);
        }
    }
}
