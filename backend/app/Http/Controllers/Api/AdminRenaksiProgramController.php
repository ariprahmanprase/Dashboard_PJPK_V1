<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RenaksiProgram;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminRenaksiProgramController extends Controller
{
    /**
     * List renaksi untuk panel admin.
     * Admin OPD otomatis hanya melihat renaksi dinasnya.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = RenaksiProgram::with(['opd', 'indikator1', 'indikator2', 'indikator3', 'indikator4'])
            ->orderBy('no');

        if ($user->isAdminOpd()) {
            $query->where('opd_id', $user->opd_id);
        } elseif ($request->filled('opd_id')) {
            $query->where('opd_id', $request->integer('opd_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->input('tahun'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('rencana_aksi', 'like', "%{$search}%")
                  ->orWhere('kode_program', 'like', "%{$search}%")
                  ->orWhere('program', 'like', "%{$search}%");
            });
        }

        $items = $query->get()->map(fn($r) => [
            'id'             => $r->id,
            'no'             => $r->no,
            'tahun'          => $r->tahun,
            'dinas'          => $r->dinas_text ?? '-',
            'opd_id'         => $r->opd_id,
            'kode_program'   => $r->kode_program,
            'program'        => $r->program,
            'rencana_aksi'   => $r->rencana_aksi,
            'jenis_target'   => $r->jenis_target,
            'target'         => $r->target,
            'target_nilai'   => $r->target_nilai,
            'target_satuan'  => $r->target_satuan,
            'realisasi'      => $r->realisasi,
            'realisasi_nilai' => $r->realisasi_nilai,
            'kendala'        => $r->kendala,
            'catatan'        => $r->catatan,
            'status'         => $r->status,
            'indikator'      => $r->indikator_list,
        ]);

        return response()->json(['data' => $items]);
    }

    /**
     * Update realisasi/kendala/catatan/status satu renaksi.
     * Admin OPD hanya boleh menyentuh renaksi milik dinasnya.
     */
    public function update(Request $request, RenaksiProgram $renaksiProgram)
    {
        $user = $request->user();

        if ($user->isAdminOpd() && $renaksiProgram->opd_id !== $user->opd_id) {
            return response()->json(['message' => 'Anda tidak berhak mengubah data dinas lain.'], 403);
        }

        $rules = [
            'kendala' => ['nullable', 'string'],
            'catatan' => ['nullable', 'string'],
            'status'  => ['required', Rule::in(['Terlaksana', 'Tidak Terlaksana'])],
        ];

        // Field realisasi mengikuti jenis_target yang sudah ditetapkan
        if ($renaksiProgram->jenis_target === 'kuantitatif') {
            $rules['realisasi_nilai'] = ['nullable', 'numeric', 'min:0'];
        } else {
            $rules['realisasi'] = ['nullable', 'string'];
        }

        // Super admin boleh mengubah target juga
        if ($user->isSuperAdmin()) {
            if ($renaksiProgram->jenis_target === 'kuantitatif') {
                $rules['target_nilai'] = ['nullable', 'numeric', 'min:0'];
                $rules['target_satuan'] = ['nullable', 'string', 'max:50'];
            } else {
                $rules['target'] = ['nullable', 'string'];
            }
        }

        $validated = $request->validate($rules);

        $renaksiProgram->update($validated);

        return response()->json([
            'message' => 'Data renaksi berhasil disimpan.',
            'data' => [
                'id'              => $renaksiProgram->id,
                'status'          => $renaksiProgram->status,
                'realisasi'       => $renaksiProgram->realisasi,
                'realisasi_nilai' => $renaksiProgram->realisasi_nilai,
                'kendala'         => $renaksiProgram->kendala,
                'catatan'         => $renaksiProgram->catatan,
            ],
        ]);
    }
}
