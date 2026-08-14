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
        // 1. Tambah 5 kolom baru ke indikators
        Schema::table('indikators', function (Blueprint $table) {
            $table->string('sumber_data', 255)->nullable()->after('satuan');
            $table->decimal('baseline_2024', 10, 2)->nullable()->after('sumber_data');
            $table->string('dokrenda', 255)->nullable()->after('baseline_2024');
            $table->text('kendala')->nullable()->after('dokrenda');
            $table->text('inovasi')->nullable()->after('kendala');
        });

        // 2. Drop kolom lower_better
        Schema::table('indikators', function (Blueprint $table) {
            $table->dropColumn('lower_better');
        });

        // 3. Jadikan opd_id nullable
        Schema::table('indikators', function (Blueprint $table) {
            // Drop existing FK constraint first if it exists, then make nullable
            try {
                $table->dropForeign(['opd_id']);
            } catch (\Exception $e) {
                // FK might not exist or might have been dropped
            }
            $table->unsignedTinyInteger('opd_id')->nullable()->change();
        });

        // 4. Buat tabel pivot indikator_opd
        Schema::create('indikator_opd', function (Blueprint $table) {
            $table->unsignedTinyInteger('indikator_id');
            $table->unsignedTinyInteger('opd_id');
            $table->primary(['indikator_id', 'opd_id']);

            $table->foreign('indikator_id')
                ->references('id')
                ->on('indikators')
                ->onDelete('cascade');

            $table->foreign('opd_id')
                ->references('id')
                ->on('opds')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop pivot table
        Schema::dropIfExists('indikator_opd');

        // 2. Kembalikan opd_id ke not nullable
        Schema::table('indikators', function (Blueprint $table) {
            $table->unsignedTinyInteger('opd_id')->nullable(false)->change();
        });

        // 3. Kembalikan lower_better
        Schema::table('indikators', function (Blueprint $table) {
            $table->enum('lower_better', ['Ya', 'Tidak'])->default('Tidak')->after('satuan');
        });

        // 4. Drop 5 kolom baru
        Schema::table('indikators', function (Blueprint $table) {
            $table->dropColumn(['inovasi', 'kendala', 'dokrenda', 'baseline_2024', 'sumber_data']);
        });
    }
};
