<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom bidang: unit/bidang di dalam dinas untuk user admin OPD (opsional).
 * Mis. dinas = Dinkopum, bidang = "Bidang HI". Kolom opd_id tetap menunjuk
 * ke entri dinas induk; bidang hanya label tambahan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('bidang', 150)->nullable()->after('opd_id')
                ->comment('Bidang/unit di dalam dinas (opsional, admin OPD)');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bidang');
        });
    }
};
