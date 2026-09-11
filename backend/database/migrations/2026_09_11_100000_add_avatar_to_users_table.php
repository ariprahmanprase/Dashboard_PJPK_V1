<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Tambah kolom avatar (path relatif di disk public) ke tabel users.
 * Nullable — user tanpa foto pakai fallback ikon.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL AFTER jabatan");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users DROP COLUMN avatar");
    }
};
