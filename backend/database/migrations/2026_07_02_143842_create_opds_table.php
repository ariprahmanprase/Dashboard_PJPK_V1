<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opds', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->string('kode_opd', 20)->unique()->comment('Singkatan OPD');
            $table->string('nama_opd', 100)->comment('Nama lengkap OPD');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opds');
    }
};
