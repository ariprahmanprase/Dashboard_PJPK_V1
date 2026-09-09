<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Indikator;
use App\Services\AiPsriService;
use Illuminate\Http\Request;

/**
 * P8 — PSRI Policy Diagnosis (admin area).
 * Hak akses: admin OPD hanya indikator yang tertaut ke dinasnya
 * (super_admin mewakili Bappeda/DP3AKB — akses lintas OPD).
 */
class AdminAiPsriController extends Controller
{
    /**
     * Dropdown indikator untuk wizard P8.
     * Admin OPD hanya menerima indikator dinasnya; role lain semua.
     */
    public function options(Request $request)
    {
        $user = $request->user();

        $query = Indikator::select('id', 'kode', 'nama_indikator', 'pilar_id')
            ->with('pilar:id,nama_pilar')
            ->orderBy('no_urut');

        if ($user->isAdminOpd()) {
            $opdId = $user->opd_id;
            $query->whereHas('opds', fn ($q) => $q->where('opds.id', $opdId));
        }

        $data = $query->get()->map(fn ($i) => [
            'kode'           => $i->kode,
            'nama_indikator' => $i->nama_indikator,
            'pilar'          => $i->pilar?->nama_pilar,
        ]);

        $tahunList = \App\Models\TargetCapaian::select('tahun')
            ->where('tahun', '>=', '2025')
            ->distinct()->orderBy('tahun', 'asc')->pluck('tahun');

        return response()->json(['data' => $data, 'tahun' => $tahunList]);
    }

    /**
     * Ambil analisis P8 tersimpan untuk indikator + tahun.
     */
    public function show(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', 'P8')
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $tahun)
            ->latest()
            ->first();

        return response()->json([
            'data' => $analisis ? [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ] : null,
        ]);
    }

    /**
     * Generate (atau regenerate) analisis P8 lalu simpan ke DB.
     */
    public function generate(Request $request, AiPsriService $service)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        try {
            $hasil = $service->generate($indikator, $tahun);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => 'P8', 'indikator_id' => $indikator->id, 'tahun' => $tahun],
            [
                'opd_id'     => $indikator->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'PSRI policy diagnosis berhasil dibuat.',
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus analisis P8 tersimpan.
     */
    public function destroy(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', 'P8')
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $tahun)
            ->delete();

        return response()->json(['message' => 'Analisis berhasil dihapus.']);
    }

    /**
     * Validasi input + resolve indikator + otorisasi.
     *
     * @return array{0: ?Indikator, 1: ?string, 2: ?\Illuminate\Http\JsonResponse}
     */
    private function resolve(Request $request): array
    {
        $request->validate([
            'kode'  => ['required', 'string', 'exists:indikators,kode'],
            'tahun' => ['required', 'digits:4'],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();

        $user = $request->user();
        if ($user->isAdminOpd()) {
            $tertaut = $indikator->opds()->where('opds.id', $user->opd_id)->exists()
                || $indikator->opd_id === $user->opd_id;
            if (! $tertaut) {
                return [null, null, response()->json(['message' => 'Anda hanya dapat menganalisis indikator dinas Anda.'], 403)];
            }
        }

        return [$indikator, $request->input('tahun'), null];
    }
}
