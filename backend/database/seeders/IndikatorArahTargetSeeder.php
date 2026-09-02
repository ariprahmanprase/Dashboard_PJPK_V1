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
            'P-01' => 'Maintain / Stable',  // Total Fertility Rate (TFR)
            'P-02' => 'Lower Better',       // ASFR 15-19 th
            'P-03' => 'Higher Better',      // Kebutuhan KB terpenuhi
            'P-04' => 'Higher Better',      // Rata-rata lama sekolah
            'P-05' => 'Higher Better',      // APK Perguruan Tinggi
            'P-06' => 'Higher Better',      // Pekerja lulusan menengah-tinggi
            'P-07' => 'Lower Better',       // Stunting
            'P-08' => 'Lower Better',       // AKB
            'P-09' => 'Lower Better',       // AKI
            'P-10' => 'Lower Better',       // Kemiskinan
            'P-11' => 'Higher Better',      // TPAK perempuan
            'P-12' => 'Lower Better',       // Pekerja informal
            'P-13' => 'Higher Better',      // Disabilitas sektor formal
            'P-14' => 'Lower Better',       // Gini ratio
            'P-15' => 'Higher Better',      // PDRB perkapita
            'P-16' => 'Lower Better',       // TPT
            'P-17' => 'Higher Better',      // Penambahan wajib pajak
            'P-18' => 'Higher Better',      // i-Bangga
            'P-19' => 'Higher Better',      // Indeks Perlindungan Anak
            'P-20' => 'Higher Better',      // Hunian layak
            'P-21' => 'Higher Better',      // Sanitasi aman
            'P-22' => 'Higher Better',      // Indeks Lansia Berdaya
            'P-23' => 'Higher Better',      // Indeks Pengasuhan Keluarga
            'P-24' => 'Higher Better',      // JKN
            'P-25' => 'Higher Better',      // Kampung KB Mandiri
            'P-26' => 'Proportional',       // Kepadatan Penduduk
            'P-27' => 'Higher Better',      // Akta kelahiran balita
            'P-28' => 'Higher Better',      // Akta cerai
            'P-29' => 'Higher Better',      // Akta nikah
            'P-30' => 'Higher Better',      // Akta kematian
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
