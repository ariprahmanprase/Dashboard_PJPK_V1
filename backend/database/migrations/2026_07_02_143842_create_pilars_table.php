<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pilars', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->unsignedTinyInteger('no_pilar')->unique()->comment('Nomor pilar 1-5');
            $table->string('nama_pilar', 100)->comment('Nama lengkap pilar');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pilars');
    }
};
