<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Indikator;
use App\Services\AiExecutiveBriefService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * P10 — Executive Brief (admin area).
 * Chaining: bahannya hasil analisis per indikator (P1/P3/P4/P6/P7/P8/P9)
 * yang sudah tersimpan. Disimpan sebagai "P10-{sumber}" agar brief dari
 * sumber berbeda tidak saling menimpa.
 * Hak akses: admin OPD hanya indikator yang tertaut ke dinasnya.
 */
class AdminAiExecutiveBriefController extends Controller
{
    /**
     * Dropdown indikator + tahun + sumber analisis yang diizinkan.
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

        $namaPrompt = collect(config('prompts.prompts', []))->pluck('nama', 'kode');
        $sumber = collect(AiExecutiveBriefService::SUMBER_VALID)->map(fn ($k) => [
            'kode' => $k,
            'nama' => $namaPrompt[$k] ?? $k,
        ])->values();

        return response()->json(['data' => $data, 'tahun' => $tahunList, 'sumber' => $sumber]);
    }

    /**
     * Sumber analisis yang SUDAH tersimpan untuk indikator + tahun,
     * beserta brief P10 yang sudah dibuat (per sumber).
     */
    public function sumberTersedia(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        $tersedia = AiAnalysis::whereIn('prompt_kode', AiExecutiveBriefService::SUMBER_VALID)
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $tahun)
            ->pluck('prompt_kode')
            ->unique()
            ->values();

        $tersimpan = AiAnalysis::where('prompt_kode', 'like', 'P10-%')
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $tahun)
            ->get()
            ->mapWithKeys(fn ($a) => [substr($a->prompt_kode, 4) => [
                'hasil'      => $a->hasil,
                'model'      => $a->model,
                'updated_at' => $a->updated_at?->format('d M Y H:i'),
                'oleh'       => $a->creator?->name,
            ]]);

        // Paksa objek kosong jadi {} (bukan []) agar frontend bisa akses per kunci.
        if ($tersimpan->isEmpty()) {
            $tersimpan = new \stdClass();
        }

        return response()->json(['sumber_tersedia' => $tersedia, 'tersimpan' => $tersimpan]);
    }

    /**
     * Generate (atau regenerate) executive brief dari hasil analisis sumber.
     */
    public function generate(Request $request, AiExecutiveBriefService $service)
    {
        $request->validate([
            'kode'   => ['required', 'string', 'exists:indikators,kode'],
            'tahun'  => ['required', 'digits:4'],
            'sumber' => ['required', Rule::in(AiExecutiveBriefService::SUMBER_VALID)],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        $tahun  = $request->input('tahun');
        $sumber = $request->input('sumber');

        // Chaining: wajib ada hasil analisis sumber yang tersimpan.
        $analisisSumber = AiAnalysis::where('prompt_kode', $sumber)
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $tahun)
            ->latest()
            ->first();

        if (! $analisisSumber) {
            return response()->json([
                'message' => "Belum ada hasil analisis {$sumber} untuk indikator & tahun ini. "
                    . "Buat dulu analisis {$sumber}, lalu kembali ke sini.",
            ], 422);
        }

        try {
            $hasil = $service->generate($indikator, $tahun, $analisisSumber->hasil, $sumber);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => "P10-{$sumber}", 'indikator_id' => $indikator->id, 'tahun' => $tahun],
            [
                'opd_id'     => $indikator->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => "Executive brief (dari {$sumber}) berhasil dibuat.",
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus brief tersimpan untuk kombinasi indikator + tahun + sumber.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'kode'   => ['required', 'string', 'exists:indikators,kode'],
            'tahun'  => ['required', 'digits:4'],
            'sumber' => ['required', Rule::in(AiExecutiveBriefService::SUMBER_VALID)],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', "P10-{$request->input('sumber')}")
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $request->input('tahun'))
            ->delete();

        return response()->json(['message' => 'Executive brief berhasil dihapus.']);
    }

    /**
     * Validasi input + resolve indikator + otorisasi (untuk sumberTersedia).
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
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return [null, null, $resp];
        }

        return [$indikator, $request->input('tahun'), null];
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
