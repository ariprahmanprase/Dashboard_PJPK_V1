<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ubah nilai enum status renaksi ke skema baru:
     * Tercapai (>=100%), Hampir Tercapai (90-99%), Tidak Tercapai (<90%), Belum diisi.
     */
    public function up(): void
    {
        // 1. Perluas enum dulu agar nilai lama & baru bisa hidup berdampingan
        DB::statement("ALTER TABLE renaksi_programs MODIFY COLUMN status ENUM(
            'Terlaksana', 'Tidak Terlaksana',
            'Tercapai', 'Hampir Tercapai', 'Tidak Tercapai', 'Belum diisi'
        ) NOT NULL DEFAULT 'Belum diisi'");

        // 2. Konversi nilai lama ke baru (data lama yang sudah dinilai)
        DB::table('renaksi_programs')->where('status', 'Terlaksana')->update(['status' => 'Tercapai']);
        DB::table('renaksi_programs')->where('status', 'Tidak Terlaksana')->update(['status' => 'Tidak Tercapai']);

        // 3. Kunci ke skema baru
        DB::statement("ALTER TABLE renaksi_programs MODIFY COLUMN status ENUM(
            'Tercapai', 'Hampir Tercapai', 'Tidak Tercapai', 'Belum diisi'
        ) NOT NULL DEFAULT 'Belum diisi'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE renaksi_programs MODIFY COLUMN status ENUM(
            'Terlaksana', 'Tidak Terlaksana',
            'Tercapai', 'Hampir Tercapai', 'Tidak Tercapai', 'Belum diisi'
        ) NOT NULL DEFAULT 'Terlaksana'");

        DB::table('renaksi_programs')->whereIn('status', ['Tercapai', 'Hampir Tercapai'])->update(['status' => 'Terlaksana']);
        DB::table('renaksi_programs')->whereIn('status', ['Tidak Tercapai', 'Belum diisi'])->update(['status' => 'Tidak Terlaksana']);

        DB::statement("ALTER TABLE renaksi_programs MODIFY COLUMN status ENUM(
            'Terlaksana', 'Tidak Terlaksana'
        ) NOT NULL DEFAULT 'Terlaksana'");
    }
};
