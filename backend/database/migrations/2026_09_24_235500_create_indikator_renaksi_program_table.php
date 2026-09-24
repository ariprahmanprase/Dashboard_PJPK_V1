<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel pivot indikator <-> renaksi_program (many-to-many, tanpa batas jumlah)
     * lalu pindahkan tautan yang selama ini tersimpan di kolom indikator_1_id..4_id.
     * Catatan: indikators.id bertipe tinyint unsigned — FK harus menyamai tipenya.
     */
    public function up(): void
    {
        Schema::create('indikator_renaksi_program', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('renaksi_program_id');
            $table->unsignedTinyInteger('indikator_id');
            $table->timestamps();

            $table->foreign('renaksi_program_id')
                ->references('id')->on('renaksi_programs')
                ->cascadeOnDelete();
            $table->foreign('indikator_id')
                ->references('id')->on('indikators')
                ->cascadeOnDelete();

            $table->unique(['renaksi_program_id', 'indikator_id'], 'irp_renaksi_indikator_unique');
        });

        // Pindahkan data lama dari kolom indikator_1_id..4_id ke pivot.
        $rows = DB::table('renaksi_programs')
            ->select('id', 'indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id')
            ->get();

        $now = now();
        $insert = [];
        foreach ($rows as $row) {
            $ids = collect([
                $row->indikator_1_id,
                $row->indikator_2_id,
                $row->indikator_3_id,
                $row->indikator_4_id,
            ])->filter()->unique();

            foreach ($ids as $indikatorId) {
                $insert[] = [
                    'renaksi_program_id' => $row->id,
                    'indikator_id'       => $indikatorId,
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ];
            }
        }

        foreach (array_chunk($insert, 500) as $chunk) {
            DB::table('indikator_renaksi_program')->insert($chunk);
        }

        // Hapus kolom lama setelah data aman berpindah.
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->dropForeign(['indikator_1_id']);
            $table->dropForeign(['indikator_2_id']);
            $table->dropForeign(['indikator_3_id']);
            $table->dropForeign(['indikator_4_id']);
            $table->dropColumn(['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id']);
        });
    }

    /**
     * Kembalikan ke struktur kolom indikator_1_id..4_id (maks. 4 tautan pertama).
     */
    public function down(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->unsignedTinyInteger('indikator_1_id')->nullable();
            $table->unsignedTinyInteger('indikator_2_id')->nullable();
            $table->unsignedTinyInteger('indikator_3_id')->nullable();
            $table->unsignedTinyInteger('indikator_4_id')->nullable();

            $table->foreign('indikator_1_id')->references('id')->on('indikators')->nullOnDelete();
            $table->foreign('indikator_2_id')->references('id')->on('indikators')->nullOnDelete();
            $table->foreign('indikator_3_id')->references('id')->on('indikators')->nullOnDelete();
            $table->foreign('indikator_4_id')->references('id')->on('indikators')->nullOnDelete();
        });

        $pivot = DB::table('indikator_renaksi_program')
            ->select('renaksi_program_id', 'indikator_id')
            ->orderBy('indikator_id')
            ->get()
            ->groupBy('renaksi_program_id');

        foreach ($pivot as $renaksiId => $items) {
            $ids = $items->pluck('indikator_id')->take(4)->values();
            DB::table('renaksi_programs')->where('id', $renaksiId)->update([
                'indikator_1_id' => $ids[0] ?? null,
                'indikator_2_id' => $ids[1] ?? null,
                'indikator_3_id' => $ids[2] ?? null,
                'indikator_4_id' => $ids[3] ?? null,
            ]);
        }

        Schema::dropIfExists('indikator_renaksi_program');
    }
};
