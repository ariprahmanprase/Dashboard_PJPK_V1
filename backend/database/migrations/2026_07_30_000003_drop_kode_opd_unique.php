<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            // Drop unique index so kode_opd doesn't need to be unique
            $table->dropUnique('opds_kode_opd_unique');
        });
    }

    public function down(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->unique('kode_opd');
        });
    }
};
