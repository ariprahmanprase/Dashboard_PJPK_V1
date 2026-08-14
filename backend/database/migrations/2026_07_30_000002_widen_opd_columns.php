<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->string('kode_opd', 100)->change();
            $table->string('nama_opd', 150)->change();
        });
    }

    public function down(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->string('kode_opd', 20)->change();
            $table->string('nama_opd', 100)->change();
        });
    }
};
