<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Opd;
use App\Services\AiOpdPortfolioService;
use Illuminate\Http\Request;

/**
 * P2 — OPD Portfolio Review (admin area).
 * Hak akses: admin OPD hanya boleh portofolio dinasnya sendiri.
 */
class AdminAiOpdController extends Controller
{
    /**
     * Dropdown OPD + tahun untuk wizard P2.
     * Admin OPD hanya menerima dinasnya sendiri.
     */
    public function options(Request $request)
    {
        $user = $request->user();

        $query = Opd::select('id', 'nama_opd')->orderBy('nama_opd');
        if ($user->isAdminOpd()) {
            $query->where('id', $user->opd_id);
        }

        // Hanya OPD yang mengampu minimal 1 indikator (via pivot / opd_id)
        $query->where(function ($q) {
            $q->whereHas('indikators')
              ->orWhereIn('id', \App\Models\Indikator::select('opd_id')->whereNotNull('opd_id'));
        });

        $tahunList = \App\Models\TargetCapaian::select('tahun')
            ->where('tahun', '>=', '2025')
            ->distinct()->orderBy('tahun', 'asc')->pluck('tahun');

        return response()->json(['data' => $query->get(), 'tahun' => $tahunList]);
    }

    /** Ambil analisis P2 tersimpan. */
    public function show(Request $request)
    {
        $request->validate([
            'opd_id' => ['required', 'integer', 'exists:opds,id'],
            'tahun'  => ['required', 'digits:4'],
        ]);

        if ($resp = $this->authorizeOpd($request, (int) $request->input('opd_id'))) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', 'P2')
            ->where('opd_id', $request->integer('opd_id'))
            ->where('tahun', $request->input('tahun'))
            ->latest()->first();

        return response()->json(['data' => $this->serialize($analisis)]);
    }

    /** Generate / regenerate analisis P2 lalu simpan. */
    public function generate(Request $request, AiOpdPortfolioService $service)
    {
        $request->validate([
            'opd_id' => ['required', 'integer', 'exists:opds,id'],
            'tahun'  => ['required', 'digits:4'],
        ]);

        $opdId = $request->integer('opd_id');
        if ($resp = $this->authorizeOpd($request, $opdId)) {
            return $resp;
        }

        $opd = Opd::findOrFail($opdId);
        $tahun = $request->input('tahun');

        // Pastikan OPD punya indikator
        $punya = $opd->indikators()->exists()
            || \App\Models\Indikator::where('opd_id', $opdId)->exists();
        if (! $punya) {
            return response()->json(['message' => 'OPD ini tidak mengampu indikator PJPK, tidak dapat dianalisis.'], 422);
        }

        try {
            $hasil = $service->generate($opd, $tahun);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => 'P2', 'opd_id' => $opdId, 'tahun' => $tahun],
            [
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json(['message' => 'Analisis portofolio OPD berhasil dibuat.', 'data' => $this->serialize($analisis)]);
    }

    /** Hapus analisis P2 tersimpan. */
    public function destroy(Request $request)
    {
        $request->validate([
            'opd_id' => ['required', 'integer', 'exists:opds,id'],
            'tahun'  => ['required', 'digits:4'],
        ]);

        if ($resp = $this->authorizeOpd($request, (int) $request->input('opd_id'))) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', 'P2')
            ->where('opd_id', $request->integer('opd_id'))
            ->where('tahun', $request->input('tahun'))
            ->delete();

        return response()->json(['message' => 'Analisis berhasil dihapus.']);
    }

    /** Admin OPD hanya boleh dinasnya sendiri. */
    private function authorizeOpd(Request $request, int $opdId): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if ($user->isAdminOpd() && $user->opd_id !== $opdId) {
            return response()->json(['message' => 'Anda hanya dapat menganalisis portofolio dinas Anda.'], 403);
        }
        return null;
    }

    private function serialize(?AiAnalysis $a): ?array
    {
        if (! $a) return null;
        return [
            'hasil'      => $a->hasil,
            'model'      => $a->model,
            'updated_at' => $a->updated_at?->format('d M Y H:i'),
            'oleh'       => $a->creator?->name,
        ];
    }
}
