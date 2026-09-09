<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P10 — Executive Brief (BUAT EXECUTIVE BRIEF PJPK).
 * Ringkasan maksimal 250 kata untuk Bupati/Sekda. Bersifat chaining:
 * bahannya adalah hasil analisis lain (P1/P3/P4/P6/P7/P8/P9) yang sudah
 * tersimpan, diringkas menjadi keputusan yang bisa dibaca pimpinan
 * dalam satu menit.
 */
class AiExecutiveBriefService
{
    /**
     * Sumber analisis yang bisa dijadikan bahan P10 (semua prompt per indikator).
     */
    public const SUMBER_VALID = ['P1', 'P3', 'P4', 'P6', 'P7', 'P8', 'P9'];

    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan executive brief untuk satu indikator pada satu tahun,
     * berdasarkan hasil analisis sumber.
     * Melempar \RuntimeException bila konfigurasi/panggilan gagal.
     */
    public function generate(Indikator $indikator, string $tahun, string $dataAnalisis, string $sumber): string
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
                    ['role' => 'user', 'content' => $this->buildPrompt($indikator, $tahun, $dataAnalisis, $sumber)],
                ],
                'temperature' => 0.3,
                'max_tokens' => 1000,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Sumopod API error: ' . $response->status() . ' ' . $response->body());
        }

        $text = $response->json('choices.0.message.content');
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Sumopod tidak mengembalikan teks brief.');
        }

        return trim($text);
    }

    /**
     * Susun user prompt P10 mengikuti template resmi "EXECUTIVE BRIEF PJPK".
     *
     * CATATAN: tidak ada placeholder yang dinonaktifkan. {{DATA_ANALISIS}}
     * diisi dari hasil analisis sumber yang TERSIMPAN (bukan di-generate
     * ulang di sini); controller menolak (422) bila sumber belum ada.
     */
    private function buildPrompt(Indikator $indikator, string $tahun, string $dataAnalisis, string $sumber): string
    {
        $template = <<<'PROMPT'
BUAT EXECUTIVE BRIEF PJPK

Data:
{{DATA_ANALISIS}}

Konteks: indikator {{INDIKATOR}}, tahun {{TAHUN}}. Brief ini dibaca Bupati/Sekda.

Maksimum 250 kata.
Jangan memberikan uraian teori.

Gunakan struktur (naratif, TANPA tabel atau garis | ):

1. STATUS — Hijau/Kuning/Merah/Abu-abu
2. WHAT HAPPENED — Satu sampai dua kalimat.
3. WHY IT MATTERS — Jelaskan implikasi pembangunan.
4. MAIN CAUSE — Maksimal dua penyebab.
5. ACTION REQUIRED — Tindakan konkret.
6. OWNER — OPD/PIC.
7. DEADLINE
8. DECISION REQUIRED — Apa yang perlu diputuskan pimpinan.

Jika tidak membutuhkan keputusan pimpinan, tulis:
"Tidak memerlukan eskalasi pada tahap ini."

Catatan penggunaan: output ringkas maksimal 250 kata untuk Sekda/Bupati.
PROMPT;

        return strtr($template, [
            '{{DATA_ANALISIS}}' => "[Hasil analisis {$sumber} — {$indikator->kode}, tahun {$tahun}]\n" . $dataAnalisis,
            '{{INDIKATOR}}'     => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator),
            '{{TAHUN}}'         => $tahun,
        ]);
    }
}
