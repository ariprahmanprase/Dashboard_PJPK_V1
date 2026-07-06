<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function scorecards(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getScorecards($filters));
    }

    public function table(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getTableData($filters));
    }

    public function renaksi(string $kode)
    {
        $indikator = \App\Models\Indikator::where('kode', $kode)->first();

        if (!$indikator) {
            return response()->json(['message' => 'Indikator tidak ditemukan'], 404);
        }

        $renaksis = $indikator->renaksis()
            ->with('opd')
            ->orderBy('tahun', 'desc')
            ->orderBy('id')
            ->get()
            ->map(fn($r, $i) => [
                'no' => $i + 1,
                'rencana_aksi' => $r->nama_kegiatan,
                'tahun' => $r->tahun,
                'status' => $r->status,
                'catatan' => $r->keterangan,
                'opd' => $r->opd->nama_opd ?? '-',
            ]);

        return response()->json([
            'indikator' => [
                'kode' => $indikator->kode,
                'nama' => $indikator->nama_indikator,
            ],
            'renaksi' => $renaksis,
        ]);
    }

    public function chart(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getChartData($filters));
    }

    public function renaksiPie(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getRenaksiPieData($filters));
    }

    public function renaksiList(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl', 'status_renaksi']);
        return response()->json($service->getRenaksiList($filters));
    }

    public function perPilar(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getPerPilar($filters));
    }

    public function perOpd(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getPerOpd($filters));
    }

    public function heatmap(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id']);
        return response()->json($service->getHeatmap($filters));
    }

    public function chartPerPilar(Request $request, DashboardService $service)
    {
        $filters = $request->only(['opd_id', 'pilar_id', 'indikator_id', 'tahun', 'status_tl']);
        return response()->json($service->getChartPerPilar($filters));
    }
}
