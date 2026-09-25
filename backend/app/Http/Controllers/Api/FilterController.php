<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Indikator;
use App\Models\Opd;
use App\Models\Pilar;
use App\Models\TargetCapaian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FilterController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'opd' => Opd::select('id', 'kode_opd', 'nama_opd')->orderBy('nama_opd')->get(),
            'pilar' => Pilar::select('id', 'no_pilar', 'nama_pilar')->orderBy('no_pilar')->get(),
            'indikator' => Indikator::select('id', 'kode', 'nama_indikator', 'pilar_id')->orderBy('no_urut')->get(),
            'tahun' => TargetCapaian::select('tahun')->distinct()->orderBy('tahun')->pluck('tahun'),
            'status_tl' => ['On Track', 'Warning', 'Alert', 'Belum Diisi'],
        ]);
    }

    /**
     * Daftar OPD yang mengampu, CASCADING mengikuti filter pilar/indikator.
     *
     * OPD "pengampu" = gabungan OPD mandat (pivot indikator_opd) + OPD yang
     * renaksinya tertaut pada indikator terkait (kontribusi) — selaras dengan
     * kolom "OPD Pengampu" di tabel/detail. Karena dihitung dari data live,
     * pembaruan renaksi/pengampu otomatis ikut tercermin di filter.
     *
     * Query params (opsional): pilar_id, indikator_id, tahun (default 2025).
     * - tanpa keduanya  → semua OPD (perilaku lama)
     * - hanya pilar_id  → OPD pengampu semua indikator dalam pilar itu
     * - indikator_id    → OPD pengampu indikator itu saja
     */
    public function opds(Request $request)
    {
        $tahun = $request->get('tahun', '2025');
        $pilarId = $request->get('pilar_id');
        $indikatorId = $request->get('indikator_id');

        // Tanpa filter pilar/indikator → semua OPD (perilaku lama).
        if (empty($pilarId) && empty($indikatorId)) {
            return response()->json(
                Opd::select('id', 'kode_opd', 'nama_opd')->orderBy('nama_opd')->get()
            );
        }

        // Indikator yang lolos filter pilar/indikator.
        $indikatorQuery = Indikator::query();
        if (!empty($pilarId)) $indikatorQuery->where('pilar_id', $pilarId);
        if (!empty($indikatorId)) $indikatorQuery->where('id', $indikatorId);
        $indikatorIds = $indikatorQuery->pluck('id');

        // OPD pengampu mandat (pivot indikator_opd).
        $opdPengampu = DB::table('indikator_opd')
            ->whereIn('indikator_id', $indikatorIds)
            ->pluck('opd_id');

        // OPD dari renaksi tertaut pada tahun berjalan.
        $opdRenaksi = DB::table('indikator_renaksi_program as irp')
            ->join('renaksi_programs as rp', 'rp.id', '=', 'irp.renaksi_program_id')
            ->whereIn('irp.indikator_id', $indikatorIds)
            ->where('rp.tahun', $tahun)
            ->whereNotNull('rp.opd_id')
            ->pluck('rp.opd_id');

        $opdIds = $opdPengampu->merge($opdRenaksi)->unique()->values();

        return response()->json(
            Opd::select('id', 'kode_opd', 'nama_opd')
                ->whereIn('id', $opdIds)
                ->orderBy('nama_opd')
                ->get()
        );
    }
}
