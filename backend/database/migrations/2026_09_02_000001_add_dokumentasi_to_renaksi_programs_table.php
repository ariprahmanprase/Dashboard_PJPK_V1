<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom dokumentasi: link opsional (GDrive / media lain) berisi
 * dokumentasi pelaksanaan rencana aksi. Diisi lewat form admin,
 * ditampilkan sebagai tautan di popup detail renaksi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->string('dokumentasi', 2048)->nullable()->after('catatan')
                ->comment('Link dokumentasi renaksi (GDrive/media lain), opsional');
        });
    }

    public function down(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->dropColumn('dokumentasi');
        });
    }
};
