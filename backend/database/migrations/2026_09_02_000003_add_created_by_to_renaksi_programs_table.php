<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Jejak audit: siapa yang menambahkan renaksi (created_by -> users.id).
 * Tanggal & jam penambahan sudah tercatat di kolom created_at bawaan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by')->nullable()->after('dokumentasi')
                ->comment('User yang menambahkan renaksi (audit)');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
