<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Opd;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminOpdController extends Controller
{
    /**
     * List OPD untuk halaman Kelola OPD (khusus super admin) —
     * sengaja SEMUA OPD, tidak dibatasi yang punya renaksi.
     */
    public function index(Request $request)
    {
        $query = Opd::query()->orderBy('nama_opd');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_opd', 'like', "%{$search}%")
                  ->orWhere('kode_opd', 'like', "%{$search}%")
                  ->orWhere('singkatan', 'like', "%{$search}%");
            });
        }

        $opds = $query->get();
        $pakai = $this->jumlahPemakaian($opds->pluck('id')->all());

        return response()->json([
            'data' => $opds->map(fn($o) => $this->serialize($o, $pakai[$o->id] ?? null)),
        ]);
    }

    /**
     * Tambah OPD baru.
     */
    public function store(Request $request)
    {
        $opd = Opd::create($this->validatePayload($request));

        return response()->json([
            'message' => 'OPD berhasil ditambahkan.',
            'data' => $this->serialize($opd),
        ], 201);
    }

    /**
     * Update OPD.
     */
    public function update(Request $request, Opd $opd)
    {
        $opd->update($this->validatePayload($request, $opd));

        return response()->json([
            'message' => 'OPD berhasil diperbarui.',
            'data' => $this->serialize($opd),
        ]);
    }

    /**
     * Hapus OPD — ditolak bila masih dipakai indikator, renaksi, atau user.
     */
    public function destroy(Opd $opd)
    {
        $pakai = $this->jumlahPemakaian([$opd->id])[$opd->id] ?? ['indikator' => 0, 'renaksi' => 0, 'user' => 0];

        if ($pakai['indikator'] > 0 || $pakai['renaksi'] > 0 || $pakai['user'] > 0) {
            $alasan = [];
            if ($pakai['indikator'] > 0) $alasan[] = "{$pakai['indikator']} indikator";
            if ($pakai['renaksi'] > 0) $alasan[] = "{$pakai['renaksi']} renaksi";
            if ($pakai['user'] > 0) $alasan[] = "{$pakai['user']} user";

            return response()->json([
                'message' => 'OPD tidak bisa dihapus karena masih dipakai ' . implode(', ', $alasan) . '.',
            ], 422);
        }

        $opd->delete();

        return response()->json(['message' => 'OPD berhasil dihapus.']);
    }

    /** Hitung pemakaian OPD (indikator/renaksi/user) sekaligus untuk banyak id. */
    private function jumlahPemakaian(array $ids): array
    {
        $indikator = DB::table('indikator_opd')->whereIn('opd_id', $ids)
            ->select('opd_id', DB::raw('count(*) as n'))->groupBy('opd_id')->pluck('n', 'opd_id');
        $renaksi = DB::table('renaksi_programs')->whereIn('opd_id', $ids)
            ->select('opd_id', DB::raw('count(*) as n'))->groupBy('opd_id')->pluck('n', 'opd_id');
        $user = DB::table('users')->whereIn('opd_id', $ids)
            ->select('opd_id', DB::raw('count(*) as n'))->groupBy('opd_id')->pluck('n', 'opd_id');

        $out = [];
        foreach ($ids as $id) {
            $out[$id] = [
                'indikator' => (int) ($indikator[$id] ?? 0),
                'renaksi' => (int) ($renaksi[$id] ?? 0),
                'user' => (int) ($user[$id] ?? 0),
            ];
        }
        return $out;
    }

    private function validatePayload(Request $request, ?Opd $opd = null): array
    {
        return $request->validate([
            'nama_opd' => [
                'required', 'string', 'max:150',
                Rule::unique('opds', 'nama_opd')->ignore($opd?->id),
            ],
            'kode_opd' => ['nullable', 'string', 'max:100'],
            'singkatan' => ['nullable', 'string', 'max:30'],
        ]);
    }

    private function serialize(Opd $o, ?array $pakai = null): array
    {
        return [
            'id' => $o->id,
            'kode_opd' => $o->kode_opd,
            'nama_opd' => $o->nama_opd,
            'singkatan' => $o->singkatan,
            'indikator_count' => $pakai['indikator'] ?? 0,
            'renaksi_count' => $pakai['renaksi'] ?? 0,
            'user_count' => $pakai['user'] ?? 0,
        ];
    }
}
