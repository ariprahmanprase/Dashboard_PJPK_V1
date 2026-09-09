<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Indikator;
use App\Services\AiCorrectiveActionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * P5 — Corrective Action Generator (admin area).
 * Chaining: bahannya adalah hasil analisis P1/P3/P4 yang sudah tersimpan.
 * Hak akses: admin OPD hanya indikator yang tertaut ke dinasnya.
 */
class AdminAiCorrectiveActionController extends Controller
{
    /**
     * Dropdown indikator + tahun + sumber analisis yang tersedia.
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

        // Sumber analisis yang diizinkan sebagai bahan P5
        $namaPrompt = collect(config('prompts.prompts', []))->pluck('nama', 'kode');
        $sumber = collect(AiCorrectiveActionService::SUMBER_VALID)->map(fn ($k) => [
            'kode' => $k,
            'nama' => $namaPrompt[$k] ?? $k,
        ])->values();

        return response()->json(['data' => $data, 'tahun' => $tahunList, 'sumber' => $sumber]);
    }

    /**
     * Daftar sumber analisis yang SUDAH tersimpan untuk indikator + tahun.
     * Dipakai frontend untuk menandai P1/P3/P4 mana yang bisa dipakai.
     */
    public function sumberTersedia(Request $request)
    {
        $request->validate([
            'kode'  => ['required', 'string', 'exists:indikators,kode'],
            'tahun' => ['required', 'digits:4'],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        $tersedia = AiAnalysis::whereIn('prompt_kode', AiCorrectiveActionService::SUMBER_VALID)
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $request->input('tahun'))
            ->pluck('prompt_kode')
            ->unique()
            ->values();

        // Hasil P5 yang sudah tersimpan untuk kombinasi ini (per sumber)
        // Hanya ambil yang berawalan "P5-" — hasil P3 lama yang salah kode tidak ikut.
        $tersimpan = AiAnalysis::where('prompt_kode', 'like', 'P5-%')
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $request->input('tahun'))
            ->get()
            ->mapWithKeys(fn ($a) => [substr($a->prompt_kode, 3) => [
                'hasil'      => $a->hasil,
                'model'      => $a->model,
                'updated_at' => $a->updated_at?->format('d M Y H:i'),
                'oleh'       => $a->creator?->name,
            ]]);

        // mapWithKeys dengan array kosong menghasilkan [] (bukan {}) saat di-JSON-kan;
        // paksa jadi objek agar frontend bisa akses tersimpan[sumber].
        if ($tersimpan->isEmpty()) {
            $tersimpan = new \stdClass();
        }

        return response()->json(['sumber_tersedia' => $tersedia, 'tersimpan' => $tersimpan]);
    }

    /**
     * Generate (atau regenerate) corrective action plan dari hasil analisis sumber.
     * prompt_kode disimpan sebagai "P5-{sumber}" (mis. P5-P3) agar tracker dari
     * sumber berbeda tidak saling menimpa.
     */
    public function generate(Request $request, AiCorrectiveActionService $service)
    {
        $request->validate([
            'kode'   => ['required', 'string', 'exists:indikators,kode'],
            'tahun'  => ['required', 'digits:4'],
            'sumber' => ['required', Rule::in(AiCorrectiveActionService::SUMBER_VALID)],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        $tahun  = $request->input('tahun');
        $sumber = $request->input('sumber');

        // P5 adalah chaining: wajib ada hasil analisis sumber yang tersimpan.
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

        $promptKode = "P5-{$sumber}";
        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => $promptKode, 'indikator_id' => $indikator->id, 'tahun' => $tahun],
            [
                'opd_id'     => $indikator->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => "Corrective action plan (dari {$sumber}) berhasil dibuat.",
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus action plan tersimpan untuk kombinasi indikator + tahun + sumber.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'kode'   => ['required', 'string', 'exists:indikators,kode'],
            'tahun'  => ['required', 'digits:4'],
            'sumber' => ['required', Rule::in(AiCorrectiveActionService::SUMBER_VALID)],
        ]);

        $indikator = Indikator::where('kode', $request->input('kode'))->firstOrFail();
        if ($resp = $this->authorizeIndikator($request, $indikator)) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', "P5-{$request->input('sumber')}")
            ->where('indikator_id', $indikator->id)
            ->where('tahun', $request->input('tahun'))
            ->delete();

        return response()->json(['message' => 'Action plan berhasil dihapus.']);
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
