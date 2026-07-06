<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('target_capaians', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->unsignedTinyInteger('indikator_id');
            $table->year('tahun');
            $table->decimal('target', 10, 2)->nullable();
            $table->decimal('capaian', 10, 2)->nullable();
            $table->decimal('gap', 10, 2)->nullable()->comment('Gap = Capaian - Target');
            $table->decimal('pct_gap', 7, 4)->nullable()->comment('Persentase gap');
            $table->enum('status_tl', ['On Track', 'Warning', 'Alert', 'Belum Diisi'])->default('Belum Diisi');
            $table->enum('warna_tl', ['Hijau', 'Kuning', 'Merah', 'Abu'])->default('Abu');
            $table->string('keterangan', 255)->nullable();
            $table->timestamps();

            $table->unique(['indikator_id', 'tahun']);
            $table->foreign('indikator_id')->references('id')->on('indikators')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('target_capaians');
    }
};
