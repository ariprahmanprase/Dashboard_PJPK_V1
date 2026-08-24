<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Isi kolom `arah_target` di tabel indikators berdasarkan
 * "Panduan arah target tiap indikator" (Saran masukan dashboard monev PJPK.pdf).
 *
 * Nilai: Higher Better | Lower Better | Maintain / Stable | Proportional
 */
class IndikatorArahTargetSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'P1-01' => 'Maintain / Stable',  // Total Fertility Rate (TFR)
            'P1-02' => 'Lower Better',       // ASFR 15-19 th
            'P1-03' => 'Higher Better',      // Kebutuhan KB terpenuhi
            'P2-01' => 'Higher Better',      // Rata-rata lama sekolah
            'P2-02' => 'Higher Better',      // APK Perguruan Tinggi
            'P2-03' => 'Higher Better',      // Pekerja lulusan menengah-tinggi
            'P2-04' => 'Lower Better',       // Stunting
            'P2-05' => 'Lower Better',       // AKB
            'P2-06' => 'Lower Better',       // AKI
            'P2-07' => 'Lower Better',       // Kemiskinan
            'P2-08' => 'Higher Better',      // TPAK perempuan
            'P2-09' => 'Lower Better',       // Pekerja informal
            'P2-10' => 'Higher Better',      // Disabilitas sektor formal
            'P2-11' => 'Lower Better',       // Gini ratio
            'P2-12' => 'Higher Better',      // PDRB perkapita
            'P2-13' => 'Lower Better',       // TPT
            'P2-14' => 'Higher Better',      // Penambahan wajib pajak
            'P3-01' => 'Higher Better',      // i-Bangga
            'P3-02' => 'Higher Better',      // Indeks Perlindungan Anak
            'P3-03' => 'Higher Better',      // Hunian layak
            'P3-04' => 'Higher Better',      // Sanitasi aman
            'P3-05' => 'Higher Better',      // Indeks Lansia Berdaya
            'P3-06' => 'Higher Better',      // Indeks Pengasuhan Keluarga
            'P3-07' => 'Higher Better',      // JKN
            'P4-01' => 'Higher Better',      // Kampung KB Mandiri
            'P4-02' => 'Proportional',       // Kepadatan Penduduk
            'P5-01' => 'Higher Better',      // Akta kelahiran balita
            'P5-02' => 'Higher Better',      // Akta cerai
            'P5-03' => 'Higher Better',      // Akta nikah
            'P5-04' => 'Higher Better',      // Akta kematian
        ];

        foreach ($map as $kode => $arahTarget) {
            $updated = DB::table('indikators')->where('kode', $kode)->update(['arah_target' => $arahTarget]);
            if ($updated === 0) {
                $this->command->warn("Kode {$kode} tidak ditemukan / tidak berubah.");
            }
        }

        $this->command->info('Kolom arah_target terisi: ' . DB::table('indikators')->whereNotNull('arah_target')->count() . ' indikator.');
    }
}
