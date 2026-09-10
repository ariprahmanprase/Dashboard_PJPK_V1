<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RenaksiProgram;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminRenaksiProgramController extends Controller
{
    /** Nilai status renaksi yang sah. */
    private const STATUSES = ['Tercapai', 'Hampir Tercapai', 'Tidak Tercapai', 'Belum diisi'];

    /** Status yang boleh ditentukan admin analis (renaksi kualitatif). */
    private const ANALIS_STATUSES = ['Tercapai', 'Tidak Tercapai', 'Belum diisi'];

    /**
     * List renaksi untuk panel admin.
     * Admin OPD otomatis hanya melihat renaksi dinasnya.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = RenaksiProgram::with([
            'opd',
            'creator',
            'indikator1.pilar', 'indikator2.pilar', 'indikator3.pilar', 'indikator4.pilar',
        ])->orderBy('no');

        if ($user->isAdminOpd()) {
            $query->where('opd_id', $user->opd_id);
        } elseif ($request->filled('opd_id')) {
            $query->where('opd_id', $request->integer('opd_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->input('tahun'));
        }
        if ($request->filled('indikator_id')) {
            $indikatorId = $request->integer('indikator_id');
            $query->where(function ($q) use ($indikatorId) {
                $q->where('indikator_1_id', $indikatorId)
                  ->orWhere('indikator_2_id', $indikatorId)
                  ->orWhere('indikator_3_id', $indikatorId)
                  ->orWhere('indikator_4_id', $indikatorId);
            });
        }
        if ($request->filled('pilar_id')) {
            $pilarId = $request->integer('pilar_id');
            $query->where(function ($q) use ($pilarId) {
                foreach (['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'] as $col) {
                    $q->orWhereIn($col, function ($sub) use ($pilarId) {
                        $sub->select('id')->from('indikators')->where('pilar_id', $pilarId);
                    });
                }
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
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
            'dokumentasi'    => $r->dokumentasi,
            'status'         => $r->status,
            'indikator'      => $r->indikator_list,
            'indikator_ids'  => $r->indikator_id_list,
            'pilar'          => $r->pilar_list,
            'ai_recommendation' => $r->ai_recommendation,
            'created_by_name' => $r->creator?->name,
            'created_at'     => $r->created_at?->format('Y-m-d H:i:s'),
        ]);

        return response()->json(['data' => $items]);
    }

    /**
     * Daftar satuan target yang sudah dipakai (untuk dropdown di form admin).
     */
    public function satuanOptions()
    {
        $satuan = RenaksiProgram::select('target_satuan')
            ->whereNotNull('target_satuan')
            ->where('target_satuan', '!=', '')
            ->distinct()
            ->orderBy('target_satuan')
            ->pluck('target_satuan');

        return response()->json(['data' => $satuan]);
    }

    /**
     * Daftar OPD untuk dropdown form tambah renaksi.
     * Admin OPD hanya menerima dinasnya sendiri.
     */
    public function opdOptions(Request $request)
    {
        $user = $request->user();

        $query = \App\Models\Opd::select('id', 'nama_opd')->orderBy('nama_opd');
        if ($user->isAdminOpd()) {
            $query->where('id', $user->opd_id);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Semua indikator untuk dropdown form tambah/edit renaksi.
     * Semua role (termasuk admin OPD) menerima daftar lengkap — admin OPD boleh
     * menautkan renaksinya ke indikator mana pun; super admin yang merevisi bila kurang tepat.
     */
    public function indikatorOptions(Request $request, \App\Services\DashboardService $service)
    {
        return response()->json([
            'data' => $service->getAllIndikatorOptions(),
        ]);
    }

    /**
     * Tambah renaksi baru.
     * Super admin bebas memilih dinas; admin OPD otomatis untuk dinasnya sendiri.
     * Status SELALU dihitung backend: kuantitatif pakai rumus, kualitatif mulai 'Belum diisi'
     * (dinilai kemudian oleh admin analis).
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $rules = [
            'tahun'          => ['required', 'digits:4'],
            'opd_id'         => ['nullable', 'integer', 'exists:opds,id'],
            'kode_program'   => ['nullable', 'string', 'max:20'],
            'program'        => ['nullable', 'string', 'max:255'],
            'rencana_aksi'   => ['required', 'string'],
            'jenis_target'   => ['required', Rule::in(['kuantitatif', 'kualitatif'])],
            'target'         => ['nullable', 'string'],
            'target_nilai'   => ['nullable', 'numeric', 'min:0'],
            'target_satuan'  => ['nullable', 'string', 'max:50'],
            'realisasi'      => ['nullable', 'string'],
            'realisasi_nilai' => ['nullable', 'numeric', 'min:0'],
            'status'         => ['nullable', Rule::in(self::STATUSES)],
            'kendala'        => ['nullable', 'string'],
            'catatan'        => ['nullable', 'string'],
            'dokumentasi'    => ['nullable', 'string', 'max:2048'],
            'indikator_ids'  => ['nullable', 'array', 'max:4'],
            'indikator_ids.*' => ['integer', 'exists:indikators,id'],
        ];

        $validated = $request->validate($rules);

        // Tentukan OPD pemilik renaksi: admin OPD dipaksa ke dinasnya sendiri
        if ($user->isAdminOpd()) {
            $validated['opd_id'] = $user->opd_id;
        } elseif ($user->isAdminAnalis()) {
            // Admin analis tidak menambah data baru — tugasnya menilai status & indikator
            return response()->json(['message' => 'Admin analis tidak berhak menambah data renaksi.'], 403);
        } elseif (empty($validated['opd_id'])) {
            return response()->json(['message' => 'Dinas/OPD wajib dipilih.'], 422);
        }

        // Status ditentukan backend untuk SEMUA role:
        // kuantitatif -> rumus target vs realisasi; kualitatif -> 'Belum diisi' (menunggu analis)
        $validated['status'] = $this->calcStatus(
            $validated['jenis_target'],
            $validated['target_nilai'] ?? null,
            $validated['realisasi_nilai'] ?? null,
        );

        // Dinas diambil dari OPD yang dipilih
        $opd = \App\Models\Opd::findOrFail($validated['opd_id']);
        $validated['dinas_text'] = $opd->nama_opd;

        // Nomor urut mengikuti nomor terbesar yang sudah ada
        $validated['no'] = ((int) RenaksiProgram::max('no')) + 1;

        // Audit: catat user yang menambahkan
        $validated['created_by'] = $user->id;

        // Tautan indikator (maks. 4) — super admin & admin OPD boleh memilih;
        // bila kurang tepat, super admin yang merevisi kemudian
        $ids = collect($request->input('indikator_ids', []))
            ->filter(fn($v) => is_numeric($v))
            ->map(fn($v) => (int) $v)
            ->filter(fn($v) => \App\Models\Indikator::whereKey($v)->exists())
            ->unique()
            ->take(4)
            ->values();
        $validated['indikator_1_id'] = $ids[0] ?? null;
        $validated['indikator_2_id'] = $ids[1] ?? null;
        $validated['indikator_3_id'] = $ids[2] ?? null;
        $validated['indikator_4_id'] = $ids[3] ?? null;
        unset($validated['indikator_ids']);

        $renaksi = RenaksiProgram::create($validated);

        return response()->json([
            'message' => 'Renaksi baru berhasil ditambahkan.',
            'data'    => ['id' => $renaksi->id, 'no' => $renaksi->no],
        ], 201);
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

        // Admin analis: menentukan status (kualitatif saja) + tautan indikator
        if ($user->isAdminAnalis()) {
            if ($renaksiProgram->jenis_target === 'kuantitatif') {
                // Status kuantitatif murni dari rumus — analis hanya boleh mengubah indikator
                $this->syncIndikator($request, $renaksiProgram, true);

                return response()->json([
                    'message' => 'Indikator berhasil disimpan. Status kuantitatif dihitung otomatis dari capaian.',
                    'data' => [
                        'id'     => $renaksiProgram->id,
                        'status' => $renaksiProgram->status,
                    ],
                ]);
            }

            $validated = $request->validate([
                'status' => ['required', Rule::in(self::ANALIS_STATUSES)],
            ]);
            $renaksiProgram->update($validated);
            $this->syncIndikator($request, $renaksiProgram, true);

            return response()->json([
                'message' => 'Status dan indikator berhasil disimpan.',
                'data' => [
                    'id'     => $renaksiProgram->id,
                    'status' => $renaksiProgram->status,
                ],
            ]);
        }

        $rules = [
            'kendala'     => ['nullable', 'string'],
            'catatan'     => ['nullable', 'string'],
            'dokumentasi' => ['nullable', 'string', 'max:2048'],
            'status'      => ['nullable', Rule::in(self::STATUSES)],
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
        unset($validated['status']); // status tidak pernah diubah manual lewat jalur ini

        $renaksiProgram->update($validated);

        // Status kuantitatif selalu dihitung ulang dari target vs realisasi terkini
        if ($renaksiProgram->jenis_target === 'kuantitatif') {
            $renaksiProgram->update([
                'status' => $this->calcStatus('kuantitatif', $renaksiProgram->target_nilai, $renaksiProgram->realisasi_nilai),
            ]);
        }

        // Tautan indikator (1-4) boleh diubah super admin & admin OPD (pemilik renaksi)
        if (!$user->isAdminAnalis() && $request->has('indikator_ids')) {
            $this->syncIndikator($request, $renaksiProgram, true);
        }

        return response()->json([
            'message' => 'Data renaksi berhasil disimpan.',
            'data' => [
                'id'              => $renaksiProgram->id,
                'status'          => $renaksiProgram->status,
                'realisasi'       => $renaksiProgram->realisasi,
                'realisasi_nilai' => $renaksiProgram->realisasi_nilai,
                'kendala'         => $renaksiProgram->kendala,
                'catatan'         => $renaksiProgram->catatan,
                'dokumentasi'     => $renaksiProgram->dokumentasi,
            ],
        ]);
    }

    /**
     * Hapus satu renaksi permanen.
     * Admin OPD hanya boleh menghapus renaksi milik dinasnya sendiri.
     */
    public function destroy(Request $request, RenaksiProgram $renaksiProgram)
    {
        $user = $request->user();

        if ($user->isAdminAnalis()) {
            return response()->json(['message' => 'Admin analis tidak berhak menghapus data renaksi.'], 403);
        }
        if ($user->isAdminOpd() && $renaksiProgram->opd_id !== $user->opd_id) {
            return response()->json(['message' => 'Anda tidak berhak menghapus data dinas lain.'], 403);
        }

        $renaksiProgram->delete();

        return response()->json(['message' => 'Data renaksi berhasil dihapus.']);
    }

    /**
     * Generate Analisis & Rekomendasi AI untuk satu renaksi (via Sumopod).
     * Admin OPD hanya boleh untuk renaksi dinasnya sendiri.
     */
    public function generateAiRecommendation(Request $request, RenaksiProgram $renaksiProgram, \App\Services\AiRecommendationService $ai)
    {
        $user = $request->user();

        if ($user->isAdminOpd() && $renaksiProgram->opd_id !== $user->opd_id) {
            return response()->json(['message' => 'Anda tidak berhak mengubah data dinas lain.'], 403);
        }

        try {
            $text = $ai->generateRecommendation($renaksiProgram);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $renaksiProgram->update(['ai_recommendation' => $text]);

        return response()->json([
            'message' => 'Rekomendasi AI berhasil dibuat.',
            'data'    => [
                'id' => $renaksiProgram->id,
                'ai_recommendation' => $text,
                'ai_model' => config('services.sumopod.model'),
            ],
        ]);
    }

    /**
     * Hapus rekomendasi AI satu renaksi.
     */
    public function deleteAiRecommendation(Request $request, RenaksiProgram $renaksiProgram)
    {
        $user = $request->user();

        if ($user->isAdminOpd() && $renaksiProgram->opd_id !== $user->opd_id) {
            return response()->json(['message' => 'Anda tidak berhak mengubah data dinas lain.'], 403);
        }

        $renaksiProgram->update(['ai_recommendation' => null]);

        return response()->json(['message' => 'Rekomendasi AI berhasil dihapus.']);
    }

    /**
     * Status renaksi kuantitatif dihitung dari target vs realisasi
     * (ambang mengikuti status indikator: >=100% Tercapai, >=90% Hampir Tercapai,
     * <90% Tidak Tercapai). Kualitatif / data belum lengkap -> 'Belum diisi'
     * (dinilai kemudian oleh admin analis).
     */
    private function calcStatus(string $jenisTarget, $targetNilai, $realisasiNilai): string
    {
        if ($jenisTarget !== 'kuantitatif') {
            return 'Belum diisi';
        }
        if ($targetNilai === null || $realisasiNilai === null || (float) $targetNilai <= 0) {
            return 'Belum diisi';
        }

        $t = (float) $targetNilai;
        $r = (float) $realisasiNilai;

        if ($r >= $t) {
            return 'Tercapai';
        }
        if ($r >= $t * 0.9) {
            return 'Hampir Tercapai';
        }

        return 'Tidak Tercapai';
    }

    /**
     * Sinkronkan tautan indikator (maks. 4) dari request indikator_ids.
     */
    private function syncIndikator(Request $request, RenaksiProgram $renaksiProgram, bool $allowed): void
    {
        if (!$allowed || !$request->has('indikator_ids')) {
            return;
        }

        $ids = collect($request->input('indikator_ids', []))
            ->filter(fn($v) => is_numeric($v))
            ->map(fn($v) => (int) $v)
            ->filter(fn($v) => \App\Models\Indikator::whereKey($v)->exists())
            ->unique()
            ->take(4)
            ->values();

        $renaksiProgram->update([
            'indikator_1_id' => $ids[0] ?? null,
            'indikator_2_id' => $ids[1] ?? null,
            'indikator_3_id' => $ids[2] ?? null,
            'indikator_4_id' => $ids[3] ?? null,
        ]);
    }

    // ─────────────────────────────────────────────────────
    //  IMPOR RENAKSI DARI EXCEL (khusus super admin & admin OPD)
    //  Indikator tidak di file — dilengkapi di aplikasi.
    // ─────────────────────────────────────────────────────

    /** Unduh template Excel kosong. */
    public function importTemplate(\App\Services\RenaksiImportService $service)
    {
        return $service->downloadTemplate();
    }

    /**
     * Terima file Excel, parse + validasi, kembalikan preview baris (tanpa menyimpan).
     * File divalidasi, dibaca, lalu dihapus — tidak disimpan permanen.
     */
    public function importPreview(Request $request, \App\Services\RenaksiImportService $service)
    {
        $user = $request->user();
        if ($user->isAdminAnalis()) {
            return response()->json(['message' => 'Admin analis tidak berhak mengimpor data.'], 403);
        }
        if ($user->isAdminOpd() && !$user->opd_id) {
            return response()->json(['message' => 'Akun Anda belum terhubung ke OPD.'], 422);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120'], // maks 5 MB
        ], [
            'file.mimes' => 'Hanya file Excel (.xlsx / .xls) yang dapat diunggah.',
            'file.max'   => 'Ukuran file melebihi 5 MB.',
        ]);

        $tmpPath = $request->file('file')->getRealPath();

        try {
            $result = $service->parseAndValidate($tmpPath);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'File tidak dapat dibaca. Pastikan format sesuai template.'], 422);
        }

        if (empty($result['rows'])) {
            return response()->json(['message' => 'Tidak ada baris data yang terbaca. Periksa kembali isi file.'], 422);
        }

        return response()->json([
            'message' => 'File berhasil dibaca.',
            'valid_count' => $result['valid_count'],
            'error_count' => $result['error_count'],
            'rows' => $result['rows'],
        ]);
    }

    /**
     * Simpan batch renaksi dari hasil preview (hanya baris valid yang dikirim).
     * Menerima ulang array 'data' dari baris valid yang dipilih admin.
     */
    public function importStore(Request $request, \App\Services\RenaksiImportService $service)
    {
        $user = $request->user();
        if ($user->isAdminAnalis()) {
            return response()->json(['message' => 'Admin analis tidak berhak mengimpor data.'], 403);
        }

        // Tentukan OPD: admin OPD dipaksa ke dinasnya sendiri
        if ($user->isAdminOpd()) {
            $opdId = $user->opd_id;
        } else {
            $opdId = $request->integer('opd_id');
        }
        if (!$opdId) {
            return response()->json(['message' => 'Dinas/OPD tidak dapat ditentukan.'], 422);
        }

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.tahun' => ['required', 'digits:4'],
            'rows.*.rencana_aksi' => ['required', 'string'],
            'rows.*.jenis_target' => ['required', Rule::in(['kuantitatif', 'kualitatif'])],
            'rows.*.kode_program' => ['nullable', 'string', 'max:20'],
            'rows.*.program' => ['nullable', 'string', 'max:255'],
            'rows.*.target' => ['nullable', 'string'],
            'rows.*.target_nilai' => ['nullable', 'numeric', 'min:0'],
            'rows.*.target_satuan' => ['nullable', 'string', 'max:50'],
            'rows.*.realisasi' => ['nullable', 'string'],
            'rows.*.realisasi_nilai' => ['nullable', 'numeric', 'min:0'],
            'rows.*.kendala' => ['nullable', 'string'],
            'rows.*.catatan' => ['nullable', 'string'],
            'rows.*.dokumentasi' => ['nullable', 'string', 'max:2048'],
        ]);

        $opd = \App\Models\Opd::findOrFail($opdId);

        $saved = $service->storeBatch(
            $validated['rows'],
            $opdId,
            $opd->nama_opd,
            $user->id
        );

        return response()->json([
            'message' => "{$saved} renaksi berhasil diimpor. Silakan lengkapi indikator terkait lewat edit.",
            'saved' => $saved,
        ], 201);
    }
}
