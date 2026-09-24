<?php

namespace App\Services;

use App\Models\RenaksiProgram;
use Illuminate\Support\Facades\Http;

/**
 * P13 — Innovation Miner (IDENTIFIKASI POTENSI INOVASI PJPK).
 * Menilai apakah suatu kegiatan/renaksi layak disebut inovasi dan berpotensi
 * direplikasi — BUKAN hanya karena baru dilaksanakan. Level analisis: per
 * renaksi (kegiatan adalah unit inovasinya).
 */
class AiInnovationMinerService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan penilaian P13 untuk satu renaksi.
     * Melempar \RuntimeException bila konfigurasi/panggilan gagal.
     */
    public function generate(RenaksiProgram $renaksi): string
    {
        $apiKey = config('services.sumopod.api_key');
        if (empty($apiKey)) {
            throw new \RuntimeException('API key Sumopod belum dikonfigurasi (SUMOPOD_API_KEY di .env).');
        }

        $baseUrl = rtrim((string) config('services.sumopod.base_url'), '/');
        $model = config('services.sumopod.model');

        $response = Http::timeout(90)
            ->withToken($apiKey)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $this->promptLibrary->master()],
                    ['role' => 'user', 'content' => $this->buildPrompt($renaksi)],
                ],
                'temperature' => 0.3,
                'max_tokens' => 2000,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Sumopod API error: ' . $response->status() . ' ' . $response->body());
        }

        $text = $response->json('choices.0.message.content');
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Sumopod tidak mengembalikan teks penilaian.');
        }

        return trim($text);
    }

    /**
     * Susun user prompt P13 mengikuti template resmi "IDENTIFIKASI POTENSI
     * INOVASI PJPK". Semua placeholder punya sumber data nyata — tidak ada
     * yang dinonaktifkan.
     */
    private function buildPrompt(RenaksiProgram $renaksi): string
    {
        $ganti = $this->petakan($renaksi);

        $template = <<<'PROMPT'
IDENTIFIKASI POTENSI INOVASI PJPK

Kegiatan/Intervensi: {{KEGIATAN}}
Masalah yang Ditangani: {{MASALAH}}
Sebelum Intervensi: {{BASELINE}}
Setelah Intervensi: {{HASIL}}
Evidence: {{BUKTI}}

Nilai inovasi berdasarkan:
1. kebaruan dalam konteks daerah;
2. relevansi terhadap masalah;
3. bukti implementasi;
4. hasil terukur;
5. keberlanjutan;
6. potensi replikasi.

Jangan menyebut suatu kegiatan sebagai inovasi hanya karena baru dilaksanakan.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

INNOVATION STATUS: BUKAN INOVASI / POTENSIAL / TERBUKTI / LAYAK DIREPLIKASI
(pilih satu)

Problem: <masalah yang ditangani>
Innovation: <apa yang baru/berbeda dari kegiatan ini — atau mengapa ini bukan inovasi>
Evidence of Result: <bukti hasil terukur yang tersedia — atau nyatakan bila belum ada>
Why It Matters: <mengapa ini penting bagi pembangunan daerah>
Replication Potential: <bisa/tidak direplikasi OPD atau wilayah lain — dengan syaratnya>
Evidence Still Needed: <bukti tambahan yang harus dikumpulkan untuk menaikkan statusnya>

Catatan penggunaan: mengidentifikasi intervensi yang layak disebut inovasi dan berpotensi direplikasi.
PROMPT;

        return strtr($template, $ganti);
    }

    /**
     * Petakan placeholder template ke data nyata renaksi.
     *
     * @return array<string, string>
     */
    private function petakan(RenaksiProgram $renaksi): array
    {
        $renaksi->loadMissing(['opd']);

        // ── Kegiatan/intervensi ────────────────────────────────────────────
        $opd  = $renaksi->dinas_text ?? $renaksi->opd?->nama_opd ?? '-';
        $prog = trim((string) ($renaksi->program ?? ''));
        $kegiatan = trim($renaksi->rencana_aksi . ($prog !== '' ? " [Program: {$prog}]" : ''))
            . " — {$opd}, tahun {$renaksi->tahun}";

        // ── Masalah yang ditangani: indikator tertaut + statusnya ──────────
        $indikatorIds = $renaksi->indikators()->pluck('indikators.id');

        $masalah = 'Belum tertaut ke indikator mana pun';
        if ($indikatorIds->isNotEmpty()) {
            $indikators = \App\Models\Indikator::whereIn('id', $indikatorIds)
                ->with(['targetCapaians' => fn ($t) => $t->where('tahun', $renaksi->tahun)])
                ->get();
            $masalah = $indikators->map(function ($i) {
                $tc = $i->targetCapaians->first();
                $status = $tc ? (trim(($tc->status_tl ?? '') . ' ' . ($tc->warna_tl ?? '')) ?: 'Belum diisi') : 'Tidak ada data';
                return "{$i->kode} {$i->nama_indikator} [{$status}]";
            })->implode('; ');
        }

        // ── Baseline: target kegiatan (kondisi yang ingin diubah) ──────────
        $baseline = $renaksi->jenis_target === 'kuantitatif'
            ? 'Target kegiatan: ' . (trim(($renaksi->target_nilai ?? '') . ' ' . ($renaksi->target_satuan ?? '')) ?: 'Belum ditetapkan')
            : 'Target kualitatif: ' . (trim((string) ($renaksi->target ?? '')) ?: 'Belum ditetapkan');

        // ── Hasil: realisasi kegiatan + status ─────────────────────────────
        $realisasi = $renaksi->jenis_target === 'kuantitatif'
            ? trim(($renaksi->realisasi_nilai ?? '') . ' ' . ($renaksi->target_satuan ?? ''))
            : trim((string) ($renaksi->realisasi ?? ''));
        $hasil = 'Realisasi: ' . ($realisasi !== '' ? $realisasi : 'Belum diisi')
            . ' | Status: ' . ($renaksi->status ?? 'Belum diisi');

        // ── Bukti: dokumentasi renaksi bila diunggah ───────────────────────
        $bukti = trim((string) ($renaksi->dokumentasi ?? '')) !== ''
            ? 'Dokumentasi terlampir: ' . $renaksi->dokumentasi
            : 'Belum ada dokumentasi terunggah — nilai bukti implementasi dari status & realisasi yang tersedia, dan tandai di "Evidence Still Needed".';

        return [
            '{{KEGIATAN}}' => $kegiatan,
            '{{MASALAH}}'  => $masalah,
            '{{BASELINE}}' => $baseline,
            '{{HASIL}}'    => $hasil,
            '{{BUKTI}}'    => $bukti,
        ];
    }
}
