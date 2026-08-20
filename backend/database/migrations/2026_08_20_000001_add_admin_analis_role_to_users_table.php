<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tambah role admin_analis ke enum users.role.
     * Admin analis: lihat semua data + isi realisasi, tanpa tambah/hapus/kelola user.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin_opd', 'admin_analis') NOT NULL DEFAULT 'admin_opd'");
    }

    public function down(): void
    {
        // Kembalikan akun analis ke admin_opd sebelum enum dipersempit
        DB::table('users')->where('role', 'admin_analis')->update(['role' => 'admin_opd']);
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin_opd') NOT NULL DEFAULT 'admin_opd'");
    }
};
