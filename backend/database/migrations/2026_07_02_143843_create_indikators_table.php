<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indikators', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->string('kode', 10)->unique()->comment('Kode: P1-01 s.d. P5-30');
            $table->unsignedTinyInteger('no_urut')->comment('Nomor urut 1-30');
            $table->unsignedTinyInteger('pilar_id');
            $table->unsignedTinyInteger('opd_id');
            $table->string('nama_indikator', 255);
            $table->string('satuan', 50);
            $table->enum('lower_better', ['Ya', 'Tidak'])->default('Tidak');
            $table->timestamps();

            $table->foreign('pilar_id')->references('id')->on('pilars')->cascadeOnDelete();
            $table->foreign('opd_id')->references('id')->on('opds')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indikators');
    }
};
