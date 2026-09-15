<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom target_max untuk indikator bertipe arah_target "In Between"
 * (mis. I-16 Tingkat Pengangguran Terbuka — target rentang 6,43–6,48).
 * NULL untuk indikator biasa (target tunggal tetap di kolom `target`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('target_capaians', function (Blueprint $table) {
            $table->decimal('target_max', 12, 4)->nullable()->after('target')
                ->comment('Batas atas rentang target (khusus arah_target In Between)');
        });
    }

    public function down(): void
    {
        Schema::table('target_capaians', function (Blueprint $table) {
            $table->dropColumn('target_max');
        });
    }
};
