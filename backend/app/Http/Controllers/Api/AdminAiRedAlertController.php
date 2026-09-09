<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\Indikator;
use App\Services\AiRedAlertService;
use Illuminate\Http\Request;

/**
 * P6 — Red Indicator Alert (admin area).
 * Sesuai logic pemanggilan: prompt ini untuk indikator berstatus MERAH.
 * Dropdown options hanya berisi indikator merah pada tahun yang dipilih.
 * Hak akses: admin OPD hanya indikator yang tertaut ke dinasnya
 * (super_admin mewakili Sekda — akses lintas OPD).
 */
class AdminAiRedAlertController extends Controller
{
    /**
     * Dropdown: daftar tahun yang punya indikator merah.
     * Indikator merah per tahun diambil lewat query param `tahun`.
     */
    public function options(Request $request)
    {
        $request->validate(['tahun' => ['required', 'digits:4']]);

        $user  = $request->user();
        $tahun = $request->input('tahun');

        $query = Indikator::select('indikators.id', 'indikators.kode', 'indikators.nama_indikator', 'indikators.pilar_id')
            ->with('pilar:id,nama_pilar')
            ->join('target_capaians', function ($j) use ($tahun) {
                $j->on('target_capaians.indikator_id', '=', 'indikators.id')
                  ->where('target_capaians.tahun', '=', $tahun)
                  ->where('target_capaians.warna_tl', '=', 'Merah');
            })
            ->orderBy('indikators.no_urut');

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
     * Daftar tahun yang punya minimal satu indikator merah.
     */
    public function tahunOptions(Request $request)
    {
        $user = $request->user();

        $query = \App\Models\TargetCapaian::select('tahun')
            ->where('warna_tl', 'Merah')
            ->where('tahun', '>=', '2025');

        if ($user->isAdminOpd()) {
            $opdId = $user->opd_id;
            $query->whereHas('indikator.opds', fn ($q) => $q->where('opds.id', $opdId));
        }

        $tahunList = $query->distinct()->orderBy('tahun')->pluck('tahun');

        return response()->json(['tahun' => $tahunList]);
    }

    /**
     * Ambil analisis P6 tersimpan untuk indikator + tahun.
     */
    public function show(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', 'P6')
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
     * Generate (atau regenerate) analisis P6 lalu simpan ke DB.
     * Menolak (422) bila indikator tidak berstatus merah pada tahun itu.
     */
    public function generate(Request $request, AiRedAlertService $service)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        $merah = $indikator->targetCapaians()
            ->where('tahun', $tahun)
            ->where('warna_tl', 'Merah')
            ->exists();

        if (! $merah) {
            return response()->json([
                'message' => "Indikator {$indikator->kode} tidak berstatus merah pada tahun {$tahun}. "
                    . 'Red alert hanya untuk indikator berstatus merah.',
            ], 422);
        }

        try {
            $hasil = $service->generate($indikator, $tahun);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => 'P6', 'indikator_id' => $indikator->id, 'tahun' => $tahun],
            [
                'opd_id'     => $indikator->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Red alert analysis berhasil dibuat.',
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus analisis P6 tersimpan.
     */
    public function destroy(Request $request)
    {
        [$indikator, $tahun, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', 'P6')
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
