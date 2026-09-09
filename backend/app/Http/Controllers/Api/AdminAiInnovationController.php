<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\RenaksiProgram;
use App\Services\AiInnovationMinerService;
use Illuminate\Http\Request;

/**
 * P13 — Innovation Miner (admin area).
 * Level analisis: per renaksi/kegiatan (kegiatan adalah unit inovasinya).
 * Disimpan sebagai prompt_kode "P13-R{id_renaksi}".
 * Hak akses: admin OPD hanya renaksi dinasnya (super_admin mewakili
 * DP3AKB/Bappeda — akses lintas OPD).
 */
class AdminAiInnovationController extends Controller
{
    /**
     * Dropdown renaksi per tahun untuk wizard P13.
     * Admin OPD hanya menerima renaksi dinasnya.
     */
    public function options(Request $request)
    {
        $request->validate(['tahun' => ['required', 'digits:4']]);

        $user  = $request->user();
        $tahun = $request->input('tahun');

        $query = RenaksiProgram::select('id', 'rencana_aksi', 'program', 'dinas_text', 'opd_id', 'status')
            ->where('tahun', $tahun)
            ->orderBy('no');

        if ($user->isAdminOpd()) {
            $query->where('opd_id', $user->opd_id);
        }

        $data = $query->get()->map(fn ($r) => [
            'id'           => $r->id,
            'rencana_aksi' => $r->rencana_aksi,
            'program'      => $r->program,
            'opd'          => $r->dinas_text ?? $r->opd?->nama_opd,
            'status'       => $r->status,
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Daftar tahun renaksi (≥ 2025).
     */
    public function tahunOptions()
    {
        $tahunList = RenaksiProgram::select('tahun')
            ->where('tahun', '>=', '2025')
            ->distinct()->orderBy('tahun')->pluck('tahun');

        return response()->json(['tahun' => $tahunList]);
    }

    /**
     * Ambil penilaian P13 tersimpan untuk satu renaksi.
     */
    public function show(Request $request)
    {
        [$renaksi, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        $analisis = AiAnalysis::where('prompt_kode', "P13-R{$renaksi->id}")
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
     * Generate (atau regenerate) penilaian P13 lalu simpan ke DB.
     * Menolak (422) bila renaksi belum punya bukti hasil sama sekali.
     */
    public function generate(Request $request, AiInnovationMinerService $service)
    {
        [$renaksi, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        // Guardrail: inovasi tidak bisa dinilai tanpa bukti hasil.
        $adaHasil = trim((string) ($renaksi->realisasi ?? '')) !== ''
            || $renaksi->realisasi_nilai !== null
            || trim((string) ($renaksi->dokumentasi ?? '')) !== ''
            || (($renaksi->status ?? 'Belum diisi') !== 'Belum diisi');

        if (! $adaHasil) {
            return response()->json([
                'message' => 'Renaksi ini belum punya realisasi/status/dokumentasi — belum bisa dinilai inovasinya. '
                    . 'Isi dulu realisasi kegiatannya di menu Admin Renaksi.',
            ], 422);
        }

        try {
            $hasil = $service->generate($renaksi);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $analisis = AiAnalysis::updateOrCreate(
            ['prompt_kode' => "P13-R{$renaksi->id}", 'indikator_id' => null, 'tahun' => $renaksi->tahun],
            [
                'opd_id'     => $renaksi->opd_id,
                'hasil'      => $hasil,
                'model'      => config('services.sumopod.model'),
                'created_by' => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Penilaian inovasi berhasil dibuat.',
            'data'    => [
                'hasil'      => $analisis->hasil,
                'model'      => $analisis->model,
                'updated_at' => $analisis->updated_at?->format('d M Y H:i'),
                'oleh'       => $analisis->creator?->name,
            ],
        ]);
    }

    /**
     * Hapus penilaian P13 tersimpan untuk satu renaksi.
     */
    public function destroy(Request $request)
    {
        [$renaksi, $resp] = $this->resolve($request);
        if ($resp) {
            return $resp;
        }

        AiAnalysis::where('prompt_kode', "P13-R{$renaksi->id}")->delete();

        return response()->json(['message' => 'Penilaian inovasi berhasil dihapus.']);
    }

    /**
     * Validasi input + resolve renaksi + otorisasi.
     *
     * @return array{0: ?RenaksiProgram, 1: ?\Illuminate\Http\JsonResponse}
     */
    private function resolve(Request $request): array
    {
        $request->validate([
            'renaksi_id' => ['required', 'integer', 'exists:renaksi_programs,id'],
        ]);

        $renaksi = RenaksiProgram::findOrFail($request->input('renaksi_id'));

        $user = $request->user();
        if ($user->isAdminOpd() && $renaksi->opd_id !== $user->opd_id) {
            return [null, response()->json(['message' => 'Anda hanya dapat menilai inovasi kegiatan dinas Anda.'], 403)];
        }

        return [$renaksi, null];
    }
}
