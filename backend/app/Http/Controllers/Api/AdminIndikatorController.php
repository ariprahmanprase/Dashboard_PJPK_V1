<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Indikator;
use App\Models\Pilar;
use App\Models\TargetCapaian;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminIndikatorController extends Controller
{
    /**
     * Update indikator + target/capaian tahun yang dipilih.
     */
    public function update(Request $request, Indikator $indikator)
    {
        $validated = $request->validate([
            'nama_indikator' => ['required', 'string', 'max:500'],
            'pilar_id'       => ['required', 'integer', 'exists:pilars,id'],
            'sumber_data'    => ['nullable', 'string', 'max:255'],
            'baseline_2024'  => ['nullable', 'string', 'max:255'],
            'dokrenda'       => ['nullable', 'string'],
            'kendala'        => ['nullable', 'string'],
            'inovasi'        => ['nullable', 'string'],
            // OPD terkait (pivot indikator_opd) — opsional, minimal 1
            'opd_ids'        => ['nullable', 'array'],
            'opd_ids.*'      => ['integer', 'exists:opds,id'],
            // target/capaian tahun berjalan (baris yang dipilih di tabel)
            'tahun'          => ['required', 'string', 'max:10'],
            'target'         => ['nullable', 'numeric'],
            'capaian'        => ['nullable', 'numeric'],
        ]);

        $indikator->update(collect($validated)->except(['tahun', 'target', 'capaian', 'opd_ids'])->toArray());

        // Sinkronkan OPD terkait jika dikirim
        if ($request->has('opd_ids')) {
            $indikator->opds()->sync(collect($validated['opd_ids'] ?? [])->unique()->values()->all());
        }

        // Simpan target/capaian untuk tahun terkait; hitung ulang gap & status
        $target = $validated['target'] ?? null;
        $capaian = $validated['capaian'] ?? null;
        $gap = ($capaian !== null && $target !== null) ? round($capaian - $target, 6) : null;
        $status = app(\App\Services\DashboardService::class)->calcStatusTL($target, $capaian);

        TargetCapaian::updateOrCreate(
            ['indikator_id' => $indikator->id, 'tahun' => $validated['tahun']],
            [
                'target'    => $target,
                'capaian'   => $capaian,
                'gap'       => $gap,
                'pct_gap'   => ($gap !== null && $target != 0) ? round($gap / $target, 6) : null,
                'status_tl' => $status['status_tl'],
                'warna_tl'  => $status['warna_tl'],
            ],
        );

        return response()->json(['message' => 'Indikator berhasil diperbarui.']);
    }

    /**
     * Hapus indikator beserta seluruh target/capaian & relasi pivotnya.
     */
    public function destroy(Request $request, Indikator $indikator)
    {
        // Lepas tautan dari renaksi_programs agar tidak menggantung
        \App\Models\RenaksiProgram::query()
            ->where('indikator_1_id', $indikator->id)->update(['indikator_1_id' => null]);
        \App\Models\RenaksiProgram::query()
            ->where('indikator_2_id', $indikator->id)->update(['indikator_2_id' => null]);
        \App\Models\RenaksiProgram::query()
            ->where('indikator_3_id', $indikator->id)->update(['indikator_3_id' => null]);
        \App\Models\RenaksiProgram::query()
            ->where('indikator_4_id', $indikator->id)->update(['indikator_4_id' => null]);

        $indikator->targetCapaians()->delete();
        $indikator->renaksis()->delete();
        $indikator->opds()->detach();
        $indikator->delete();

        return response()->json(['message' => 'Indikator berhasil dihapus.']);
    }

    /**
     * Daftar pilar untuk dropdown form edit.
     */
    public function pilarOptions()
    {
        return response()->json(['data' => Pilar::orderBy('no_pilar')->get(['id', 'no_pilar', 'nama_pilar'])]);
    }
}
