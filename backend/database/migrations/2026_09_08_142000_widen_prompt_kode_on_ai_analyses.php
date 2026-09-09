<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Lebarkan kolom prompt_kode dari 5 → 12 karakter.
 * Diperlukan untuk kode berantai (chaining) seperti "P5-P3" (5, pas),
 * "P10-P6" (6), dst. — batas lama memotong kode P10-*.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE ai_analyses MODIFY prompt_kode VARCHAR(12) NOT NULL COMMENT 'Kode prompt: P1..P13, atau berantai mis. P5-P3, P10-P6'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE ai_analyses MODIFY prompt_kode VARCHAR(5) NOT NULL COMMENT 'Kode prompt: P1, P2, dst.'");
    }
};
