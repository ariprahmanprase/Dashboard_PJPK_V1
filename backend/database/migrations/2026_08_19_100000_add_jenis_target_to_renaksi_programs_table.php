<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->enum('jenis_target', ['kuantitatif', 'kualitatif'])
                ->default('kualitatif')
                ->after('realisasi');
            $table->decimal('target_nilai', 15, 2)->nullable()->after('jenis_target');
            $table->string('target_satuan', 50)->nullable()->after('target_nilai');
            $table->decimal('realisasi_nilai', 15, 2)->nullable()->after('target_satuan');
        });
    }

    public function down(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->dropColumn(['jenis_target', 'target_nilai', 'target_satuan', 'realisasi_nilai']);
        });
    }
};
