<?php

namespace App\Console\Commands;

use App\Models\RenaksiProgram;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Gabungkan renaksi duplikat (teks+OPD+tahun+program+target+jenis identik)
 * menjadi satu baris. Tautan indikator digabung ke pivot. Baris "induk"
 * = yang isinya paling lengkap; bila setara, yang paling baru diupdate.
 * Kelompok dengan isi realisasi/kendala BERBEDA dilaporkan sebagai konflik
 * dan hanya digabung bila dijalankan dengan --force (induk menang).
 *
 * Jalankan: php artisan renaksi:merge-duplicates --dry-run
 *           php artisan renaksi:merge-duplicates
 */
class MergeDuplicateRenaksi extends Command
{
    protected $signature = 'renaksi:merge-duplicates
                            {--dry-run : Hanya laporkan, tanpa mengubah data}
                            {--force : Gabungkan juga kelompok yang isinya konflik (induk menang)}';

    protected $description = 'Gabungkan renaksi duplikat menjadi satu baris dengan banyak indikator';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        // Kelompokkan kandidat duplikat dengan kunci lengkap
        $groups = RenaksiProgram::query()
            ->select([
                'opd_id', 'tahun', 'rencana_aksi',
                DB::raw("COALESCE(program,'') AS k_program"),
                DB::raw("COALESCE(kode_program,'') AS k_kode_program"),
                DB::raw("COALESCE(target,'') AS k_target"),
                DB::raw("COALESCE(target_nilai,-1) AS k_target_nilai"),
                DB::raw("COALESCE(target_satuan,'') AS k_target_satuan"),
                'jenis_target',
                DB::raw('COUNT(*) AS jml'),
                DB::raw('GROUP_CONCAT(id ORDER BY id) AS ids'),
            ])
            ->groupBy(
                'opd_id', 'tahun', 'rencana_aksi',
                'k_program', 'k_kode_program', 'k_target',
                'k_target_nilai', 'k_target_satuan', 'jenis_target',
            )
            ->having('jml', '>', 1)
            ->get();

        if ($groups->isEmpty()) {
            $this->info('Tidak ada duplikat ditemukan.');
            return self::SUCCESS;
        }

        $totalGabung = 0;
        $totalHapus = 0;
        $konflik = [];

        foreach ($groups as $g) {
            $ids = array_map('intval', explode(',', $g->ids));
            $rows = RenaksiProgram::with('indikators')->whereIn('id', $ids)->get();

            // Induk = isi paling lengkap; tie-break: updated_at terbaru
            $skor = fn(RenaksiProgram $r) =>
                ($r->status !== 'Belum diisi' ? 4 : 0)
                + (filled($r->realisasi) || $r->realisasi_nilai !== null ? 2 : 0)
                + (filled($r->kendala) ? 1 : 0)
                + (filled($r->dokumentasi) ? 1 : 0);
            $induk = $rows->sortBy([
                fn($a, $b) => $skor($b) <=> $skor($a),
                fn($a, $b) => $b->updated_at <=> $a->updated_at,
            ])->first();

            $anak = $rows->where('id', '!=', $induk->id);

            // Deteksi konflik isi antar baris
            $isiBerbeda =
                $rows->pluck('status')->unique()->count() > 1 ||
                $rows->map(fn($r) => (string) ($r->realisasi ?? ''))->unique()->count() > 1 ||
                $rows->map(fn($r) => (string) ($r->realisasi_nilai ?? '-1'))->unique()->count() > 1 ||
                $rows->map(fn($r) => (string) ($r->kendala ?? ''))->unique()->count() > 1;

            $indikatorGabung = $rows->flatMap(fn($r) => $r->indikators->pluck('id'))->unique()->values();

            if ($isiBerbeda) {
                $konflik[] = [
                    'induk_id' => $induk->id,
                    'ids' => $ids,
                    'rencana_aksi' => mb_substr($g->rencana_aksi, 0, 80),
                    'detail' => $rows->map(fn($r) => [
                        'id' => $r->id,
                        'status' => $r->status,
                        'realisasi' => $r->jenis_target === 'kuantitatif'
                            ? ($r->realisasi_nilai !== null ? (string) $r->realisasi_nilai : null)
                            : $r->realisasi,
                    ])->all(),
                ];
                if (!$force) {
                    $this->warn("KONFLIK dilewati (induk kandidat #{$induk->id}): " . mb_substr($g->rencana_aksi, 0, 60) . '…');
                    continue;
                }
            }

            if (!$dryRun) {
                DB::transaction(function () use ($induk, $anak, $indikatorGabung) {
                    // Gabungkan indikator ke induk + jadikan induk status paling informatif
                    $induk->indikators()->sync($indikatorGabung);

                    // Renomor baris anak tidak perlu — cukup hapus; kolom `no` induk dipertahankan
                    foreach ($anak as $row) {
                        $row->delete();
                    }
                });
            }

            $totalGabung++;
            $totalHapus += $anak->count();

            $this->line(
                ($dryRun ? '[DRY] ' : '') .
                "Induk #{$induk->id} ← hapus [" . $anak->pluck('id')->implode(',') . "] — " .
                count($indikatorGabung) . " indikator — " . mb_substr($g->rencana_aksi, 0, 55) . '…'
            );
        }

        $this->newLine();
        $this->info("Kelompok digabung: {$totalGabung} | Baris dihapus: {$totalHapus}" . ($dryRun ? ' (DRY RUN — tidak ada perubahan)' : ''));

        if (!empty($konflik)) {
            $this->newLine();
            $this->warn('=== ' . count($konflik) . ' KELOMPOK KONFLIK (isi berbeda antar duplikat) ===');
            foreach ($konflik as $k) {
                $this->warn("#{$k['induk_id']} kandidat induk | ids: " . implode(',', $k['ids']) . " | {$k['rencana_aksi']}");
                foreach ($k['detail'] as $d) {
                    $this->line("   - id {$d['id']}: status={$d['status']}, realisasi=" . var_export($d['realisasi'], true));
                }
            }
            $this->warn('Kelompok konflik ' . ($force ? 'DIGABUNG (induk menang).' : 'DILEWATI. Jalankan dengan --force untuk menggabung (induk menang).'));
        }

        return self::SUCCESS;
    }
}
