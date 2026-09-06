<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Indikator;
use App\Services\AiIndikatorAnalysisService;
use Illuminate\Http\Request;

/**
 * P1 — Indicator Performance Analysis (admin area).
 * Hak akses: admin OPD hanya indikator yang tertaut ke dinasnya.
 */
class AdminAiIndikatorController extends Controller
{
    /**
     * Dropdown indikator untuk wizard P1.
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
            'kode'          => $i->kode,
            'nama_indikator' => $i->nama_indikator,
            'pilar'         => $i->pilar?->nama_pilar,
        ]);

        // Daftar tahun tersedia (dari target_capaians), dibatasi mulai 2025
        $tahunList = \App\Models\TargetCapaian::select('tahun')
            ->where('tahun', '>=', '2025')
            ->distinct()->orderBy('tahun', 'asc')->pluck('tahun');

        return response()->json(['data' => $data, 'tahun' => $tahunList]);
    }

    /**
     * Ambil analisis P1 tersimpan untuk indikator + tahun.
     */
    public function show(Request $request)
    {
        $request->validate([
            'kode'  => ['required', 'string', 'exists:indikators,kode'],
            'tahun' => ['required', 'digits:4'],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', 'P1')
            ->where('indikator_id', $indikator->id)
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
     * Generate (atau regenerate) analisis P1 lalu simpan ke DB.
     */
    public function generate(Request $request, AiIndikatorAnalysisService $service)
    {
        $request->validate([
            'kode'  => ['required', 'string', 'exists:indikators,kode'],
            'tahun' => ['required', 'digits:4'],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        $tahun = $request->input('tahun');

        try {
            $hasil = $service->generate($indikator, $tahun);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => 'P1', 'indikator_id' => $indikator->id, 'tahun' => $tahun],
            [
                'opd_id'     => $indikator->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Analisis indikator berhasil dibuat.',
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus analisis P1 tersimpan.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'kode'  => ['required', 'string', 'exists:indikators,kode'],
            'tahun' => ['required', 'digits:4'],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', 'P1')
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $request->input('tahun'))
            ->delete();

        return response()->json(['message' => 'Analisis berhasil dihapus.']);
    }

    /**
     * Admin OPD hanya boleh indikator yang tertaut ke dinasnya.
     */
    private function authorizeIndikator(Request $request, Indikator $indikator): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if ($user->isAdminOpd()) {
            $tertaut = $indikator->opds()->where('opds.id', $user->opd_id)->exists()
                || $indikator->opd_id === $user->opd_id;
            if (! $tertaut) {
                return response()->json(['message' => 'Anda hanya dapat menganalisis indikator dinas Anda.'], 403);
            }
        }
        return null;
    }
}
