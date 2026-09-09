<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Indikator;
use App\Services\AiDataGapService;
use Illuminate\Http\Request;

/**
 * P7 — Data Gap Analysis (admin area).
 * Sesuai logic pemanggilan: prompt ini untuk indikator yang datanya kosong /
 * belum tervalidasi (status Abu = belum diisi, atau realisasi kosong).
 * Hak akses: admin OPD hanya indikator yang tertaut ke dinasnya.
 */
class AdminAiDataGapController extends Controller
{
    /**
     * Dropdown: indikator yang datanya belum memadai pada tahun terpilih
     * (warna Abu = belum diisi, atau tidak ada baris target_capaians sama sekali).
     */
    public function options(Request $request)
    {
        $request->validate(['tahun' => ['required', 'digits:4']]);

        $user  = $request->user();
        $tahun = $request->input('tahun');

        $query = Indikator::select('indikators.id', 'indikators.kode', 'indikators.nama_indikator', 'indikators.pilar_id')
            ->with('pilar:id,nama_pilar')
            ->leftJoin('target_capaians', function ($j) use ($tahun) {
                $j->on('target_capaians.indikator_id', '=', 'indikators.id')
                  ->where('target_capaians.tahun', '=', $tahun);
            })
            ->where(function ($q) {
                $q->whereNull('target_capaians.id')           // tidak ada baris sama sekali
                  ->orWhere('target_capaians.warna_tl', 'Abu') // belum diisi
                  ->orWhereNull('target_capaians.capaian');    // realisasi kosong
            })
            ->orderBy('indikators.no_urut')
            ->distinct();

        if ($user->isAdminOpd()) {
            $opdId = $user->opd_id;
            $query->whereHas('opds', fn ($q) => $q->where('opds.id', $opdId));
        }

        $data = $query->get()->map(fn ($i) => [
            'kode'           => $i->kode,
            'nama_indikator' => $i->nama_indikator,
            'pilar'          => $i->pilar?->nama_pilar,
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Daftar tahun acuan (sama seperti prompt lain: dari target_capaians ≥ 2025).
     */
    public function tahunOptions()
    {
        $tahunList = \App\Models\TargetCapaian::select('tahun')
            ->where('tahun', '>=', '2025')
            ->distinct()->orderBy('tahun')->pluck('tahun');

        return response()->json(['tahun' => $tahunList]);
    }

    /**
     * Ambil analisis P7 tersimpan untuk indikator + tahun.
     */
    public function show(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', 'P7')
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
     * Generate (atau regenerate) analisis P7 lalu simpan ke DB.
     */
    public function generate(Request $request, AiDataGapService $service)
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
            ['prompt_kode' => 'P7', 'indikator_id' => $indikator->id, 'tahun' => $tahun],
            [
                'opd_id'     => $indikator->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Data gap analysis berhasil dibuat.',
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus analisis P7 tersimpan.
     */
    public function destroy(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', 'P7')
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
