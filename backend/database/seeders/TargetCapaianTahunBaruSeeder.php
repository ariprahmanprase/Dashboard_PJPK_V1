<?php

namespace Database\Seeders;

use App\Models\Indikator;
use App\Models\TargetCapaian;
use Illuminate\Database\Seeder;

/**
 * Buat baris target_capaian untuk tahun 2026–2029 bagi semua indikator,
 * dengan target & capaian NULL (status otomatis "Belum Diisi").
 *
 * Indikator yang dipantau sama setiap tahun — hanya angkanya yang
 * diisi kemudian oleh OPD. Idempotent: baris yang sudah ada dilewati.
 *
 * Jalankan: php artisan db:seed --class=TargetCapaianTahunBaruSeeder
 */
class TargetCapaianTahunBaruSeeder extends Seeder
{
    private const TAHUN_BARU = ['2026', '2027', '2028', '2029'];

    public function run(): void
    {
        $indikatorIds = Indikator::pluck('id');
        $dibuat = 0;
        $dilewati = 0;

        foreach (self::TAHUN_BARU as $tahun) {
            $sudahAda = TargetCapaian::where('tahun', $tahun)
                ->pluck('indikator_id')
                ->flip();

            foreach ($indikatorIds as $indikatorId) {
                if ($sudahAda->has($indikatorId)) {
                    $dilewati++;
                    continue;
                }
                TargetCapaian::create([
                    'indikator_id' => $indikatorId,
                    'tahun'        => $tahun,
                    'target'       => null,
                    'capaian'      => null,
                    'status_tl'    => 'Belum Diisi',
                    'warna_tl'     => 'Abu',
                ]);
                $dibuat++;
            }
        }

        $this->command->info("Selesai: {$dibuat} baris dibuat, {$dilewati} dilewati (sudah ada).");
    }
}
