<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indikators', function (Blueprint $table) {
            // Naik | Turun | Stabil | Mengikuti jumlah penduduk
            $table->string('arah', 50)->nullable()->after('satuan');
        });
    }

    public function down(): void
    {
        Schema::table('indikators', function (Blueprint $table) {
            $table->dropColumn('arah');
        });
    }
};
