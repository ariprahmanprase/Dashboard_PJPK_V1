<?php

namespace Database\Seeders;

use App\Models\RenaksiProgram;
use Illuminate\Database\Seeder;

/**
 * Hitung ulang status seluruh renaksi sesuai aturan baru:
 * - Kuantitatif: >=100% Tercapai, >=90% Hampir Tercapai, <90% Tidak Tercapai,
 *   target/realisasi kosong -> Belum diisi
 * - Kualitatif: yang sudah dinilai (status lama Terlaksana/Tidak Terlaksana,
 *   kini Tercapai/Tidak Tercapai oleh migrasi) dipertahankan; sisanya -> Belum diisi
 */
class RecalcRenaksiStatusSeeder extends Seeder
{
    public function run(): void
    {
        $hitung = ['Tercapai' => 0, 'Hampir Tercapai' => 0, 'Tidak Tercapai' => 0, 'Belum diisi' => 0];

        RenaksiProgram::query()->chunkById(200, function ($rows) use (&$hitung) {
            foreach ($rows as $r) {
                if ($r->jenis_target === 'kuantitatif') {
                    $status = $this->calcKuantitatif($r->target_nilai, $r->realisasi_nilai);
                } else {
                    // Kualitatif: pertahankan penilaian analis yang sudah ada
                    $status = in_array($r->status, ['Tercapai', 'Tidak Tercapai'], true)
                        ? $r->status
                        : 'Belum diisi';
                }

                if ($r->status !== $status) {
                    $r->update(['status' => $status]);
                }
                $hitung[$status]++;
            }
        });

        $this->command->info('✅ Status renaksi dihitung ulang: ' . collect($hitung)->map(fn($n, $s) => "{$s}: {$n}")->implode(' · '));
    }

    private function calcKuantitatif($target, $realisasi): string
    {
        if ($target === null || $realisasi === null || (float) $target <= 0) {
            return 'Belum diisi';
        }

        $t = (float) $target;
        $r = (float) $realisasi;

        if ($r >= $t) return 'Tercapai';
        if ($r >= $t * 0.9) return 'Hampir Tercapai';
        return 'Tidak Tercapai';
    }
}
