<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Indikator;
use App\Models\Opd;
use App\Models\Pilar;
use App\Models\TargetCapaian;

class FilterController extends Controller
{
    public function __invoke()
    {
        return response()->json([
            'opd' => Opd::select('id', 'kode_opd', 'nama_opd')->orderBy('nama_opd')->get(),
            'pilar' => Pilar::select('id', 'no_pilar', 'nama_pilar')->orderBy('no_pilar')->get(),
            'indikator' => Indikator::select('id', 'kode', 'nama_indikator')->orderBy('no_urut')->get(),
            'tahun' => TargetCapaian::select('tahun')->distinct()->orderBy('tahun')->pluck('tahun'),
            'status_tl' => ['On Track', 'Warning', 'Alert', 'Belum Diisi'],
        ]);
    }
}
