<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P4 — Activity-Outcome Effectiveness (EVALUASI EFEKTIVITAS KEGIATAN
 * TERHADAP OUTCOME PJPK). Menguji apakah kegiatan yang dijalankan OPD
 * benar-benar berkontribusi terhadap outcome indikator.
 *
 * Matriks analisis:
 *   A. Aktivitas tinggi + outcome baik  → faktor keberhasilan & keberlanjutan
 *   B. Aktivitas tinggi + outcome buruk → EFFECTIVENESS GAP
 *   C. Aktivitas rendah + outcome baik  → attribution gap / faktor eksternal
 *   D. Aktivitas rendah + outcome buruk → IMPLEMENTATION GAP
 */
class AiActivityEffectivenessService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P4 untuk satu indikator pada satu tahun.
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
                'max_tokens' => 2500,
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
     * Susun user prompt P4 mengikuti template resmi
     * "EVALUASI EFEKTIVITAS KEGIATAN TERHADAP OUTCOME PJPK".
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        // ────────────────────────────────────────────────────────────────────
        // CATATAN PENONAKTIFAN FIELD (data belum tersedia di DB).
        //
        // Komentar PHP ini TIDAK ikut terkirim ke AI. Satu placeholder dari
        // template resmi dinonaktifkan (dihapus dari teks yang dikirim):
        //
        //   1. Realisasi Anggaran ({{ANGGARAN}})
        //      Alasan: sistem belum punya kolom/tabel anggaran/serapan per
        //      kegiatan renaksi, sehingga nilai apa pun akan mengarang
        //      (melanggar prinsip P0 #1/#2). Konsekuensinya, penilaian
        //      efisiensi biaya-per-output tidak dapat dilakukan; matriks
        //      efektivitas dinilai dari data aktivitas vs outcome saja.
        //      Aktifkan kembali bila sudah ada sumber anggaran per kegiatan.
        //
        // Untuk mengaktifkan lagi: tambahkan kembali baris placeholder di template
        // di bawah DAN isi nilainya di method petakan().
        // ────────────────────────────────────────────────────────────────────
        $template = <<<'PROMPT'
EVALUASI EFEKTIVITAS KEGIATAN TERHADAP OUTCOME PJPK

Indikator: {{INDIKATOR}}
Target Outcome: {{TARGET}}
Realisasi Outcome: {{REALISASI}}
Kegiatan: {{KEGIATAN}}
Target Kegiatan: {{TARGET_KEGIATAN}}
Realisasi Kegiatan: {{REALISASI_KEGIATAN}}

Analisis menggunakan matriks:
A. Aktivitas tinggi + outcome baik → identifikasi faktor keberhasilan dan keberlanjutan.
B. Aktivitas tinggi + outcome buruk → identifikasi EFFECTIVENESS GAP.
C. Aktivitas rendah + outcome baik → periksa attribution gap/faktor eksternal.
D. Aktivitas rendah + outcome buruk → identifikasi IMPLEMENTATION GAP.

Jawab:
1. apakah kegiatan relevan terhadap indikator;
2. apakah output berpotensi menghasilkan outcome;
3. apakah outcome dapat dikaitkan secara masuk akal dengan kegiatan;
4. apakah kegiatan perlu diteruskan, diperbaiki, dihentikan atau didesain ulang.

Jangan menyarankan tambahan anggaran tanpa evaluasi desain program.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Posisi Matriks
   Kuadran: <A / B / C / D>
   Alasan Penempatan: <bukti dari data aktivitas dan outcome>

B. Jawaban Empat Pertanyaan — daftar bernomor sesuai pertanyaan di atas:
   1. Relevansi Kegiatan: <jawaban + bukti>
   2. Potensi Output → Outcome: <jawaban + bukti>
   3. Keterkaitan Outcome dengan Kegiatan: <jawaban + bukti>
   4. Keputusan Kegiatan: <diteruskan / diperbaiki / dihentikan / didesain ulang — dengan alasan>

C. Status Efektivitas
   Status: <EFEKTIF / PERLU PERBAIKAN / TIDAK CUKUP BUKTI / REDESIGN REQUIRED>
   Alasan: <uraian>
   Rekomendasi: <tindakan konkret — ACTION + OWNER + DEADLINE + OUTPUT + EVIDENCE>

Catatan penggunaan: analisis ini digunakan untuk menguji efektivitas kegiatan terhadap outcome.
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
        // ── Arah kinerja (penilaian "outcome baik/buruk" bergantung arah) ───
        $arahMentah = strtolower(trim((string) ($indikator->arah_target ?? '')));
        $arah = match (true) {
            str_contains($arahMentah, 'naik'), str_contains($arahMentah, 'tinggi'), str_contains($arahMentah, 'higher')
                => 'Semakin tinggi semakin baik (higher is better)',
            str_contains($arahMentah, 'turun'), str_contains($arahMentah, 'rendah'), str_contains($arahMentah, 'lower')
                => 'Semakin rendah semakin baik (lower is better)',
            default => 'Kontekstual / jaga stabilitas (arah tidak naik/turun tegas)',
        };

        // ── Target & realisasi outcome tahun terpilih ──────────────────────
        $riwayat = $indikator->targetCapaians()->orderBy('tahun')->get();
        $tahunIni = $riwayat->firstWhere('tahun', $tahun);

        $fmt = fn ($v) => $v === null || $v === '' ? 'Belum tersedia' : (string) $v;

        $target   = $tahunIni?->target;
        $capaian  = $tahunIni?->capaian;
        $satuan   = trim((string) ($indikator->satuan ?? ''));

        // Tren dipakai konteks (efektivitas sulit dinilai dari satu tahun saja)
        $tren = $riwayat->map(function ($t) use ($fmt) {
            $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? '')) ?: '-';
            return "{$t->tahun}: target {$fmt($t->target)} → realisasi {$fmt($t->capaian)} ({$status})";
        })->implode('; ') ?: 'Belum tersedia';

        // ── Kegiatan / rencana aksi terkait tahun ini ──────────────────────
        // Sumber: renaksi_programs (tertaut via pivot indikator_renaksi_program).
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->whereHas('indikators', fn($q) => $q->where('indikators.id', $indikator->id))
            ->orderBy('no')
            ->get();

        $kegiatan = $renaksiProgram->map(function ($r) {
            $opd = $r->dinas_text ?? $r->opd?->nama_opd ?? '-';
            $prog = trim((string) ($r->program ?? ''));
            $prog = $prog === '' ? '' : " [Program: {$prog}]";
            return "{$r->rencana_aksi}{$prog} — {$opd} ({$r->status})";
        })->implode('; ') ?: 'Belum tersedia';

        // Target kegiatan per renaksi (mengikuti jenis_target)
        $targetKegiatan = $renaksiProgram->map(function ($r) {
            $t = $r->jenis_target === 'kuantitatif'
                ? trim(($r->target_nilai ?? '') . ' ' . ($r->target_satuan ?? '')) ?: null
                : $r->target;
            return $t ? "{$r->rencana_aksi}: {$t}" : null;
        })->filter()->implode('; ') ?: 'Belum tersedia';

        // Realisasi kegiatan per renaksi + status
        $realisasiKegiatan = $renaksiProgram->map(function ($r) {
            $t = $r->jenis_target === 'kuantitatif'
                ? trim(($r->realisasi_nilai ?? '') . ' ' . ($r->target_satuan ?? '')) ?: null
                : $r->realisasi;
            $st = $r->status ?? '-';
            return $t ? "{$r->rencana_aksi}: {$t} [{$st}]" : "{$r->rencana_aksi} [{$st}]";
        })->implode('; ') ?: 'Belum tersedia';

        return [
            '{{INDIKATOR}}'          => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator)
                . ' | Arah: ' . $arah
                . ' | Tren: ' . $tren,
            '{{TARGET}}'             => $fmt($target) . ($satuan && $target !== null ? " {$satuan}" : ''),
            '{{REALISASI}}'          => $fmt($capaian) . ($satuan && $capaian !== null ? " {$satuan}" : ''),
            '{{KEGIATAN}}'           => $kegiatan,
            '{{TARGET_KEGIATAN}}'    => $targetKegiatan,
            '{{REALISASI_KEGIATAN}}' => $realisasiKegiatan,
            // NONAKTIF — {{ANGGARAN}}: data anggaran belum tersedia di DB
            // (lihat catatan di buildPrompt). Placeholder-nya sudah dihapus
            // dari template, jadi tidak dikirim ke AI.
        ];
    }
}
