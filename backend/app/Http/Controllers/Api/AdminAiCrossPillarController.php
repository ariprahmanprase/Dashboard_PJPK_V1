<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Services\AiCrossPillarService;
use Illuminate\Http\Request;

/**
 * P12 — Cross-Pillar Strategic Synthesis (admin area).
 * Membaca SELURUH pilar sekaligus — karena itu hanya untuk role dengan
 * pandangan lintas dinas (super_admin mewakili Sekda/Bappeda). Admin OPD
 * ditolak (403): portofolio satu dinas tidak cukup untuk sintesis ini.
 *
 * Satu hasil per tahun (indikator_id NULL).
 */
class AdminAiCrossPillarController extends Controller
{
    /**
     * Dropdown tahun acuan (dari target_capaians ≥ 2025).
     */
    public function options()
    {
        $tahunList = \App\Models\TargetCapaian::select('tahun')
            ->where('tahun', '>=', '2025')
            ->distinct()->orderBy('tahun', 'asc')->pluck('tahun');

        return response()->json(['tahun' => $tahunList]);
    }

    /**
     * Ambil sintesis P12 tersimpan untuk satu tahun.
     */
    public function show(Request $request)
    {
        $request->validate(['tahun' => ['required', 'digits:4']]);
        if ($resp = $this->authorizeLintasDinas($request)) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', 'P12')
            ->whereNull('indikator_id')
            ->where('tahun', $request->input('tahun'))
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
     * Generate (atau regenerate) sintesis P12 untuk satu tahun.
     */
    public function generate(Request $request, AiCrossPillarService $service)
    {
        $request->validate(['tahun' => ['required', 'digits:4']]);
        if ($resp = $this->authorizeLintasDinas($request)) {
            return $resp;
        }

        $tahun = $request->input('tahun');

        try {
            $hasil = $service->generate($tahun);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => 'P12', 'indikator_id' => null, 'tahun' => $tahun],
            [
                'opd_id'     => null,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Sintesis lintas pilar berhasil dibuat.',
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus sintesis P12 tersimpan untuk satu tahun.
     */
    public function destroy(Request $request)
    {
        $request->validate(['tahun' => ['required', 'digits:4']]);
        if ($resp = $this->authorizeLintasDinas($request)) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', 'P12')
            ->whereNull('indikator_id')
            ->where('tahun', $request->input('tahun'))
            ->delete();

        return response()->json(['message' => 'Sintesis berhasil dihapus.']);
    }

    /**
     * Hanya role dengan pandangan lintas dinas (bukan admin OPD).
     */
    private function authorizeLintasDinas(Request $request): ?\Illuminate\Http\JsonResponse
    {
        if ($request->user()->isAdminOpd()) {
            return response()->json([
                'message' => 'Sintesis lintas pilar membutuhkan pandangan seluruh OPD — hanya tersedia untuk super admin (Sekda/Bappeda).',
            ], 403);
        }
        return null;
    }
}
