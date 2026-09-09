<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P11 — Planning & Budget Alignment (ANALISIS INTEGRASI PJPK DENGAN
 * PERENCANAAN DAN PENGANGGARAN).
 *
 * STATUS: BELUM DITAMPILKAN DI UI.
 * Prompt ini sengaja hanya punya backend (service + controller + route) dan
 * belum punya halaman/menu frontend, karena sebagian besar placeholder-nya
 * menunggu data dokumen perencanaan & anggaran yang belum ada di DB.
 * Untuk mengaktifkan: lengkapi data (lihat catatan penonaktifan di
 * buildPrompt), buat halaman frontend, lalu set 'aktif' => true untuk P11
 * di config/prompts.php.
 */
class AiPlanningBudgetService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P11 untuk satu indikator pada satu tahun.
     * Melempar \RuntimeException bila konfigurasi/panggilan gagal.
     */
    public function generate(Indikator $indikator, string $tahun): string
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
                    ['role' => 'user', 'content' => $this->buildPrompt($indikator, $tahun)],
                ],
                'temperature' => 0.3,
                'max_tokens' => 3000,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Sumopod API error: ' . $response->status() . ' ' . $response->body());
        }

        $text = $response->json('choices.0.message.content');
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Sumopod tidak mengembalikan teks analisis.');
        }

        return trim($text);
    }

    /**
     * Susun user prompt P11 mengikuti template resmi "ANALISIS INTEGRASI PJPK
     * DENGAN PERENCANAAN DAN PENGANGGARAN".
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        // ────────────────────────────────────────────────────────────────────
        // CATATAN PENONAKTIFAN FIELD (data belum tersedia di DB).
        //
        // Komentar PHP ini TIDAK ikut terkirim ke AI. Lima placeholder dari
        // template resmi dinonaktifkan (dihapus dari teks yang dikirim) karena
        // datanya memang belum ada, sesuai prinsip "jangan dipaksakan":
        //
        //   1. Renstra ({{RENSTRA}})   — belum ada data dokumen Renstra OPD.
        //   2. RKPD ({{RKPD}})         — belum ada data dokumen RKPD.
        //   3. Renja ({{RENJA}})       — belum ada data dokumen Renja.
        //   4. Subkegiatan ({{SUBKEGIATAN}}) — tabel renaksi_programs tidak
        //      memiliki kolom subkegiatan (hanya sampai program + rencana aksi).
        //   5. Anggaran ({{ANGGARAN}}) — belum ada kolom/tabel anggaran/pagu
        //      per kegiatan di DB.
        //
        // Yang TERSEDIA dan dipakai:
        //   - RPJMD ({{RPJMD}})  ← kolom indikators.dokrenda (terisi 30/30).
        //   - Program ({{PROGRAM}}) & Kegiatan ({{KEGIATAN}}) ← renaksi_programs.
        //   - Sasaran PJPK ({{SASARAN_PJPK}}) ← pilar + target/realisasi.
        //
        // Konsekuensi: LEVEL 1 & 2 (substantive & indicator alignment) dapat
        // dinilai; LEVEL 3 hanya sampai program/kegiatan — aspek subkegiatan
        // dan anggaran akan ditandai AI sebagai data gap (status akhir biasanya
        // PARTIALLY ALIGNED dengan catatan anggaran belum dapat diverifikasi).
        //
        // Untuk mengaktifkan lagi: tambahkan kembali baris placeholder di template
        // di bawah DAN isi nilainya di method petakan().
        // ────────────────────────────────────────────────────────────────────
        $template = <<<'PROMPT'
ANALISIS INTEGRASI PJPK DENGAN PERENCANAAN DAN PENGANGGARAN

Indikator: {{INDIKATOR}}
Sasaran PJPK: {{SASARAN_PJPK}}
RPJMD: {{RPJMD}}
Program: {{PROGRAM}}
Kegiatan: {{KEGIATAN}}

Analisis tiga level:
LEVEL 1 – SUBSTANTIVE ALIGNMENT
Apakah sasaran dan arah kebijakan konsisten?

LEVEL 2 – INDICATOR ALIGNMENT
Apakah indikator dan target konsisten?

LEVEL 3 – IMPLEMENTATION ALIGNMENT
Apakah program dan kegiatan yang berjalan mendukung target PJPK?

Berikan status:
FULLY ALIGNED
PARTIALLY ALIGNED
NOT ALIGNED

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Hasil Tiga Level — daftar bernomor; setiap nomor berisi sub-label:
   1. Level: <LEVEL 1 – SUBSTANTIVE / LEVEL 2 – INDICATOR / LEVEL 3 – IMPLEMENTATION>
      Status: <FULLY ALIGNED / PARTIALLY ALIGNED / NOT ALIGNED>
      Gap: <celah yang ditemukan, atau "tidak ada gap teridentifikasi">
      Tindakan: <tindakan untuk menutup gap — bila ada>

B. Perbaikan Dokumen
   Bila terdapat gap, jelaskan dokumen mana yang harus diperbaiki dan pada siklus
   perencanaan kapan. Tulis sebagai daftar bernomor. Bila tidak ada gap, tulis
   satu kalimat bahwa tidak diperlukan perubahan dokumen.

C. Status Akhir
   STATUS ALIGNMENT KESELURUHAN: <FULLY ALIGNED / PARTIALLY ALIGNED / NOT ALIGNED>
   disertai satu kalimat alasan.

Catatan penggunaan: dipakai Bappeda untuk menilai alignment PJPK dengan dokumen
perencanaan dan penganggaran.
PROMPT;

        return strtr($template, $ganti);
    }

    /**
     * Petakan placeholder template ke data nyata indikator.
     *
     * @return array<string, string>
     */
    private function petakan(Indikator $indikator, string $tahun): array
    {
        $fmt = fn ($v) => $v === null || $v === '' ? 'Belum tersedia' : (string) $v;

        // ── Sasaran PJPK: pilar + arah + target/realisasi tahun terpilih ───
        $riwayat  = $indikator->targetCapaians()->orderBy('tahun')->get();
        $tahunIni = $riwayat->firstWhere('tahun', $tahun);
        $satuan   = trim((string) ($indikator->satuan ?? ''));

        $sasaran = 'Pilar: ' . ($indikator->pilar?->nama_pilar ?? '-')
            . " | Target {$tahun}: " . $fmt($tahunIni?->target) . ($satuan && $tahunIni?->target !== null ? " {$satuan}" : '')
            . " | Realisasi {$tahun}: " . $fmt($tahunIni?->capaian) . ($satuan && $tahunIni?->capaian !== null ? " {$satuan}" : '')
            . ' | Baseline 2024: ' . $fmt($indikator->baseline_2024);

        // ── RPJMD: dari kolom dokrenda (terisi untuk seluruh indikator) ────
        $rpjmd = trim((string) ($indikator->dokrenda ?? '')) ?: 'Belum tercatat di sistem';

        // ── Program & kegiatan dari renaksi_programs tahun terpilih ────────
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->where(function ($q) use ($indikator) {
                foreach (['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'] as $col) {
                    $q->orWhere($col, $indikator->id);
                }
            })
            ->orderBy('no')
            ->get();

        $program = $renaksiProgram->map(function ($r) {
            $kode = trim((string) ($r->kode_program ?? ''));
            $prog = trim((string) ($r->program ?? ''));
            $label = trim(($kode !== '' ? "{$kode} — " : '') . $prog);
            return $label !== '' ? $label : null;
        })->filter()->unique()->implode('; ') ?: 'Belum tersedia';

        $kegiatan = $renaksiProgram->map(function ($r) {
            $opd = $r->dinas_text ?? $r->opd?->nama_opd ?? '-';
            return "{$r->rencana_aksi} — {$opd} ({$r->status})";
        })->implode('; ') ?: 'Belum tersedia';

        return [
            '{{INDIKATOR}}'    => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator)
                . ' | OPD: ' . ($indikator->opds->pluck('nama_opd')->filter()->implode(', ') ?: '-'),
            '{{SASARAN_PJPK}}' => $sasaran,
            '{{RPJMD}}'        => $rpjmd,
            '{{PROGRAM}}'      => $program,
            '{{KEGIATAN}}'     => $kegiatan,
            // NONAKTIF — {{RENSTRA}}, {{RKPD}}, {{RENJA}}, {{SUBKEGIATAN}},
            // {{ANGGARAN}}: data belum tersedia di DB (lihat catatan di
            // buildPrompt). Placeholder-nya sudah dihapus dari template,
            // jadi tidak dikirim ke AI.
        ];
    }
}
