<?php

namespace App\Services;

use App\Models\Indikator;
use App\Models\RenaksiProgram;
use Illuminate\Support\Facades\DB;

/**
 * Perakit prompt dari Prompt Library (config/prompts.php).
 *
 * master() menghasilkan system message P0 dengan placeholder diganti
 * angka nyata dari database. Prompt analisis P1–P13 akan memakai system
 * message ini lalu menambahkan template user-message-nya masing-masing.
 */
class AiPromptLibrary
{
    /**
     * Ambil daftar prompt analisis (P1–P13) dari config.
     *
     * @param  bool  $hanyaAktif  true = hanya yang datanya tersedia di dashboard
     * @return array<int, array<string, mixed>>
     */
    public function daftar(bool $hanyaAktif = true): array
    {
        $semua = config('prompts.prompts', []);

        if (! $hanyaAktif) {
            return array_values($semua);
        }

        return array_values(array_filter($semua, fn ($p) => ! empty($p['aktif'])));
    }

    /**
     * Master System Prompt (P0) — jadi system message untuk semua analisis.
     * Placeholder {…} diganti statistik nyata dari database.
     */
    public function master(): string
    {
        $template = (string) config('prompts.master.template', '');

        return $this->isiPlaceholder($template, $this->statistik());
    }

    /**
     * Statistik ringkas database untuk konteks P0.
     *
     * @return array<string, string|int>
     */
    private function statistik(): array
    {
        $tahunAktif = RenaksiProgram::query()->max('tahun')
            ?? Indikator::query()->max('tahun')
            ?? date('Y');

        return [
            'jumlah_indikator'    => Indikator::query()->count(),
            'jumlah_opd'          => DB::table('opds')->count(),
            'jumlah_renaksi'      => RenaksiProgram::query()->count(),
            'renaksi_kuantitatif' => RenaksiProgram::query()->where('jenis_target', 'kuantitatif')->count(),
            'renaksi_kualitatif'  => RenaksiProgram::query()->where('jenis_target', 'kualitatif')->count(),
            'tahun_aktif'         => $tahunAktif,
            'tanggal_hari_ini'    => now()->translatedFormat('d F Y'),
        ];
    }

    /**
     * Ganti placeholder {kunci} di template dengan nilai dari $data.
     *
     * @param  array<string, string|int>  $data
     */
    private function isiPlaceholder(string $template, array $data): string
    {
        $ganti = [];
        foreach ($data as $kunci => $nilai) {
            $ganti['{'.$kunci.'}'] = (string) $nilai;
        }

        return strtr($template, $ganti);
    }
}
