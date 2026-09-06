<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_analyses', function (Blueprint $table) {
            $table->id();
            $table->string('prompt_kode', 5)->index()->comment('Kode prompt: P1, P2, dst.');
            // Tipe mengikuti PK tabel indikators & opds (tinyint unsigned)
            $table->unsignedTinyInteger('indikator_id')->nullable()->index();
            $table->unsignedTinyInteger('opd_id')->nullable()->index();
            $table->string('tahun', 4)->nullable();
            $table->longText('hasil')->comment('Teks hasil analisis AI');
            $table->string('model')->nullable()->comment('Model AI yang dipakai');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('indikator_id')->references('id')->on('indikators')->nullOnDelete();
            $table->foreign('opd_id')->references('id')->on('opds')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_analyses');
    }
};
