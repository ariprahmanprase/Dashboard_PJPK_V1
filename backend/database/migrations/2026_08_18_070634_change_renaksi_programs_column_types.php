<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('renaksi_programs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('no')->nullable();
            $table->unsignedTinyInteger('opd_id')->nullable();
            $table->foreign('opd_id')->references('id')->on('opds')->onDelete('set null');
            $table->string('kode_program', 20)->nullable();
            $table->string('program', 255)->nullable();
            $table->longText('rencana_aksi');
            $table->longText('target')->nullable();
            $table->longText('realisasi')->nullable();
            $table->text('kendala')->nullable();
            $table->text('catatan')->nullable();
            $table->unsignedTinyInteger('indikator_1_id')->nullable();
            $table->unsignedTinyInteger('indikator_2_id')->nullable();
            $table->unsignedTinyInteger('indikator_3_id')->nullable();
            $table->unsignedTinyInteger('indikator_4_id')->nullable();
            $table->foreign('indikator_1_id')->references('id')->on('indikators')->onDelete('set null');
            $table->foreign('indikator_2_id')->references('id')->on('indikators')->onDelete('set null');
            $table->foreign('indikator_3_id')->references('id')->on('indikators')->onDelete('set null');
            $table->foreign('indikator_4_id')->references('id')->on('indikators')->onDelete('set null');
            $table->enum('status', ['Terlaksana', 'Tidak Terlaksana'])->default('Terlaksana');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('renaksi_programs');
    }
};
