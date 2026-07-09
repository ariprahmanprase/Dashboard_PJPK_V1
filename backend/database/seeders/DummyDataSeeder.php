<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Indikator;
use App\Models\TargetCapaian;
use App\Models\Renaksi;

class DummyDataSeeder extends Seeder
{
    use WithoutModelEvents;

    /** Tahun yang akan diisi */
    private array $tahunRange = [2025, 2026, 2027, 2028, 2029];

    /** Kegiatan template per OPD */
    private array $kegiatanTemplates = [
        'DP3AKB' => [
            'Sosialisasi {topik} ke {lokasi}',
            'Pelatihan kader {topik}',
            'Monitoring dan evaluasi {topik}',
            'Pendataan {topik} tingkat desa',
            'Koordinasi lintas sektor {topik}',
            'Publikasi data {topik}',
            'Distribusi sarana {topik}',
        ],
        'Dinkes' => [
            'Survei {topik} tingkat puskesmas',
            'Pelatihan tenaga kesehatan tentang {topik}',
            'Skrining {topik} di posyandu',
            'Kampanye kesehatan {topik}',
            'Peningkatan kapasitas faskes untuk {topik}',
            'Distribusi suplemen gizi untuk {topik}',
            'Audit kasus {topik}',
        ],
        'Disdik' => [
            'Beasiswa pendidikan untuk siswa kurang mampu',
            'Pelatihan guru tentang {topik}',
            'Pembangunan fasilitas pendidikan di daerah {lokasi}',
            'Program literasi dan numerasi {topik}',
            'Bimbingan belajar gratis {topik}',
            'Kerjasama dengan perguruan tinggi untuk {topik}',
        ],
        'Disnaker' => [
            'Job fair dan bursa kerja {topik}',
            'Pelatihan vokasi {topik}',
            'Sertifikasi kompetensi {topik}',
            'Program padat karya {topik}',
            'Pendampingan UMKM {topik}',
            'Magang industri untuk {topik}',
            'Fasilitasi penempatan tenaga kerja {topik}',
        ],
        'Dukcapil' => [
            'Jemput bola {topik} ke desa',
            'Integrasi data {topik} dengan fasilitas kesehatan',
            'Sosialisasi pentingnya {topik}',
            'Pelayanan keliling {topik}',
            'Pencetakan massal {topik}',
            'Verifikasi dan validasi data {topik}',
            'Kerjasama dengan desa untuk percepatan {topik}',
        ],
        'Bappeda' => [
            'Analisis data {topik}',
            'Koordinasi perencanaan {topik}',
            'Penyusunan dokumen {topik}',
            'Evaluasi program {topik}',
            'Review dan rekomendasi kebijakan {topik}',
        ],
        'DPUPR' => [
            'Pembangunan infrastruktur {topik}',
            'Rehabilitasi fasilitas {topik}',
            'Pengadaan sarana prasarana {topik}',
            'Peningkatan akses {topik}',
            'Studi kelayakan {topik}',
        ],
        'Disperkim' => [
            'Bantuan rumah tidak layak huni {topik}',
            'Penyediaan hunian terjangkau {topik}',
            'Peningkatan kawasan kumuh {topik}',
            'Fasilitasi PSU perumahan {topik}',
            'Pendataan kawasan permukiman {topik}',
        ],
        'BPPKAD' => [
            'Optimalisasi pajak daerah {topik}',
            'Sosialisasi kepatuhan pajak {topik}',
            'Pendataan wajib pajak {topik}',
            'Integrasi sistem pajak {topik}',
            'Evaluasi potensi pajak {topik}',
        ],
    ];

    private array $lokasi = [
        '18 kecamatan', 'Kecamatan Sidoarjo', 'Kecamatan Buduran',
        'Kecamatan Taman', 'Kecamatan Porong', 'Kecamatan Krian',
        'Kecamatan Waru', 'Kecamatan Sedati', 'Kecamatan Gedangan',
        'desa prioritas', 'seluruh desa/kelurahan', 'wilayah percontohan',
        'kecamatan pesisir', 'kecamatan perbatasan',
    ];

    private array $keteranganDone = [
        'Selesai 100%, laporan sudah diserahkan',
        'Terealisasi sesuai jadwal, output tercapai',
        'Berjalan lancar, semua target terpenuhi',
        'Sudah selesai dan divalidasi',
        'Pelaksanaan sesuai rencana, dokumentasi lengkap',
    ];

    private array $keteranganPending = [
        'Anggaran belum cair',
        'Menunggu koordinasi lintas OPD',
        'Jadwal bentrok dengan kegiatan lain',
        'Petugas belum tersedia',
        'Data pendukung belum lengkap',
        'Menunggu revisi juknis',
        'Terkendala akses lokasi',
        'Perlu persetujuan pimpinan',
    ];

    public function run(): void
    {
        $this->command->info('🔧 Memulai seeding data dummy...');
        $this->command->info('');

        $indikators = Indikator::with('pilar', 'opd')->get();

        // ─── 1. Update TargetCapaian ────────────────────────────
        $this->command->info('📊 Memperbarui data target capaian...');
        $totalUpdated = 0;

        foreach ($indikators as $indikator) {
            foreach ($this->tahunRange as $tahun) {
                $tc = TargetCapaian::firstOrNew([
                    'indikator_id' => $indikator->id,
                    'tahun'        => $tahun,
                ]);

                // Skip jika capaian 2025 sudah terisi (data real)
                if ($tahun === 2025 && $tc->capaian !== null && $tc->exists) {
                    continue;
                }

                // Set target jika belum ada
                if ($tc->target === null) {
                    $tc->target = $this->generateTarget($indikator, $tahun);
                }

                // Generate capaian realistis
                $capaian = $this->generateCapaian($indikator, $tc->target, $tahun);
                $tc->capaian = $capaian['capaian'];
                $gap = round($capaian['capaian'] - $tc->target, 2);
                $tc->gap = $gap;
                $tc->pct_gap = $tc->target != 0 ? round($gap / $tc->target, 4) : 0;
                $tc->status_tl = $capaian['status_tl'];
                $tc->warna_tl = $capaian['warna_tl'];
                $tc->keterangan = $capaian['keterangan'];

                $tc->save();
                $totalUpdated++;
            }
        }

        $this->command->info("   ✅ {$totalUpdated} record target_capaian diperbarui.");
        $this->command->info('');

        // ─── 2. Tambah Renaksi ──────────────────────────────────
        $this->command->info('📋 Menambah data rencana aksi...');
        $totalRenaksi = 0;

        // Hapus renaksi dummy lama (opsional: skip yang real)
        // Kita tambah saja, tidak hapus yang sudah ada

        foreach ($indikators as $indikator) {
            $opd = $indikator->opd;
            $kodeOpd = $opd->kode_opd;
            $templates = $this->kegiatanTemplates[$kodeOpd] ?? $this->kegiatanTemplates['Bappeda'];

            // 2025: 2-5 renaksi per indikator
            $count2025 = random_int(2, 5);
            for ($i = 0; $i < $count2025; $i++) {
                $status = $this->weightedRandom(['Terlaksana' => 70, 'Tidak Terlaksana' => 30]);
                $namaKegiatan = $this->buildKegiatan($templates[$i % count($templates)], $indikator->nama_indikator);

                $keterangan = $status === 'Terlaksana'
                    ? $this->keteranganDone[array_rand($this->keteranganDone)]
                    : $this->keteranganPending[array_rand($this->keteranganPending)];

                Renaksi::create([
                    'indikator_id'   => $indikator->id,
                    'tahun'          => 2025,
                    'opd_id'         => $opd->id,
                    'nama_kegiatan'  => $namaKegiatan,
                    'status'         => $status,
                    'keterangan'     => $keterangan,
                    'kolaborasi_opd' => $i === 0 && random_int(0, 3) === 0
                        ? collect(['Dinkes', 'Disdik', 'Dukcapil', 'DPUPR'])->random()
                        : null,
                ]);
                $totalRenaksi++;
            }

            // 2026: 1-3 renaksi per indikator
            $count2026 = random_int(1, 3);
            for ($i = 0; $i < $count2026; $i++) {
                $namaKegiatan = $this->buildKegiatan($templates[($i + 2) % count($templates)], $indikator->nama_indikator);

                Renaksi::create([
                    'indikator_id'   => $indikator->id,
                    'tahun'          => 2026,
                    'opd_id'         => $opd->id,
                    'nama_kegiatan'  => $namaKegiatan,
                    'status'         => 'Terlaksana', // 2026 early year, mostly terlaksana
                    'keterangan'     => random_int(0, 1) ? 'Sedang berjalan, progress 60%' : 'Tahap persiapan selesai',
                    'kolaborasi_opd' => null,
                ]);
                $totalRenaksi++;
            }
        }

        $this->command->info("   ✅ {$totalRenaksi} rencana aksi baru ditambahkan.");
        $this->command->info('');
        $this->command->info('🎉 Data dummy berhasil di-seed!');
        $this->command->info('');
        $this->command->info('💡 Untuk restore data asli: php artisan db:restore');
    }

    // ─── Helper Methods ────────────────────────────────────────

    private function generateTarget($indikator, int $tahun): float
    {
        $base = match ($indikator->satuan) {
            '%'     => random_int(70, 95),
            'Indeks' => round(mt_rand(60, 90) / 100, 2),
            'Anak/WUS', '/1000 WUS', '/1000 KH' => round(mt_rand(10, 50) / 10, 2),
            '/100.000 KH' => round(mt_rand(50, 200), 2),
            'Tahun' => round(mt_rand(8, 15) + mt_rand(0, 5) / 10, 1),
            'Rp Juta' => round(mt_rand(40, 100), 2),
            'Jiwa/km2' => round(mt_rand(2000, 8000), 2),
            default  => round(mt_rand(50, 95), 2),
        };

        // Slight improvement trend each year
        $offset = (2025 - $tahun) * 0.5;
        return round($base + $offset, 2);
    }

    private function generateCapaian($indikator, float $target, int $tahun): array
    {
        // 2025: mixed results, 2026-2029: more optimistic since it's set as target
        $rand = mt_rand(0, 100);

        if ($tahun >= 2027) {
            // Future years: mostly on track or slightly below
            $variant = $rand < 50 ? 'on_track' : ($rand < 85 ? 'warning' : 'alert');
        } elseif ($tahun === 2026) {
            $variant = $rand < 45 ? 'on_track' : ($rand < 75 ? 'warning' : 'alert');
        } else {
            // 2025
            $variant = $rand < 40 ? 'on_track' : ($rand < 70 ? 'warning' : 'alert');
        }

        $lowerBetter = $indikator->lower_better === 'Ya';

        $capaian = match ($variant) {
            'on_track' => $lowerBetter
                ? $target * (1 - mt_rand(1, 10) / 100)   // capaian < target (good)
                : $target * (1 + mt_rand(1, 15) / 100),  // capaian > target (good)
            'warning' => $lowerBetter
                ? $target * (1 + mt_rand(1, 15) / 100)   // capaian > target (bad)
                : $target * (1 - mt_rand(1, 15) / 100),  // capaian < target (bad)
            'alert' => $lowerBetter
                ? $target * (1 + mt_rand(15, 35) / 100)  // jauh di atas target
                : $target * (1 - mt_rand(15, 35) / 100), // jauh di bawah target
        };

        $capaian = round($capaian, 2);

        $status_tl = match ($variant) {
            'on_track' => 'On Track',
            'warning'  => 'Warning',
            'alert'    => 'Alert',
        };

        $warna_tl = match ($variant) {
            'on_track' => 'Hijau',
            'warning'  => 'Kuning',
            'alert'    => 'Merah',
        };

        $keterangan = match ($variant) {
            'on_track' => 'Capaian sesuai target',
            'warning'  => 'Perlu perhatian, mendekati batas toleransi',
            'alert'    => 'Butuh intervensi segera',
        };

        return [
            'capaian'    => $capaian,
            'status_tl'  => $status_tl,
            'warna_tl'   => $warna_tl,
            'keterangan' => $keterangan,
        ];
    }

    private function buildKegiatan(string $template, string $indikatorName): string
    {
        // Simplify indikator name untuk topic
        $topic = strtok($indikatorName, '(');
        $topic = trim($topic) ?: $indikatorName;

        $lokasi = $this->lokasi[array_rand($this->lokasi)];

        return str_replace(
            ['{topik}', '{lokasi}'],
            [$topic, $lokasi],
            $template
        );
    }

    private function weightedRandom(array $weights): string
    {
        $rand = mt_rand(1, array_sum($weights));
        foreach ($weights as $key => $weight) {
            $rand -= $weight;
            if ($rand <= 0) return $key;
        }
        return array_key_first($weights);
    }
}
