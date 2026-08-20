<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tambah status 'Belum diisi' untuk renaksi yang target/realisasinya belum lengkap.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE renaksi_programs MODIFY COLUMN status ENUM('Terlaksana', 'Tidak Terlaksana', 'Belum diisi') NOT NULL DEFAULT 'Terlaksana'");
    }

    public function down(): void
    {
        DB::table('renaksi_programs')->where('status', 'Belum diisi')->update(['status' => 'Tidak Terlaksana']);
        DB::statement("ALTER TABLE renaksi_programs MODIFY COLUMN status ENUM('Terlaksana', 'Tidak Terlaksana') NOT NULL DEFAULT 'Terlaksana'");
    }
};
