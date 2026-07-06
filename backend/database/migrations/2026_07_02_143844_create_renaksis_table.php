<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('renaksis', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedTinyInteger('indikator_id');
            $table->year('tahun');
            $table->unsignedTinyInteger('opd_id');
            $table->string('nama_kegiatan', 255);
            $table->enum('status', ['Terlaksana', 'Tidak Terlaksana'])->default('Terlaksana');
            $table->text('keterangan')->nullable();
            $table->string('kolaborasi_opd', 100)->nullable();
            $table->timestamps();

            $table->foreign('indikator_id')->references('id')->on('indikators')->cascadeOnDelete();
            $table->foreign('opd_id')->references('id')->on('opds')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('renaksis');
    }
};
