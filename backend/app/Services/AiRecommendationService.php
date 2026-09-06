<?php

namespace App\Services;

use App\Models\RenaksiProgram;
use Illuminate\Support\Facades\Http;

class AiRecommendationService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Generate Analisis & Rekomendasi untuk satu renaksi program via Sumopod
     * (API OpenAI-compatible: POST {base_url}/chat/completions).
     * Melempar \RuntimeException bila konfigurasi kurang atau panggilan gagal.
     */
    public function generateRecommendation(RenaksiProgram $renaksi): string
    {
        $apiKey = config('services.sumopod.api_key');
        if (empty($apiKey)) {
            throw new \RuntimeException('API key Sumopod belum dikonfigurasi (SUMOPOD_API_KEY di .env).');
        }

        $baseUrl = rtrim((string) config('services.sumopod.base_url'), '/');
        $model = config('services.sumopod.model');

        $response = Http::timeout(60)
            ->withToken($apiKey)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->promptLibrary->master(),
                    ],
                    [
                        'role' => 'user',
                        'content' => $this->buildPrompt($renaksi),
                    ],
                ],
                'temperature' => 0.4,
                'max_tokens' => 1024,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Sumopod API error: ' . $response->status() . ' ' . $response->body());
        }

        $text = $response->json('choices.0.message.content');
        if (!is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Sumopod tidak mengembalikan teks rekomendasi.');
        }

        return trim($text);
    }

    /**
     * Susun prompt dari data renaksi.
     */
    private function buildPrompt(RenaksiProgram $renaksi): string
    {
        $indikators = collect($renaksi->indikator_list)->map(fn($n, $i) => ($i + 1) . ". {$n}")->implode("\n");
        $target = $renaksi->jenis_target === 'kuantitatif'
            ? trim(($renaksi->target_nilai ?? '-') . ' ' . ($renaksi->target_satuan ?? ''))
            : ($renaksi->target ?? '-');
        $realisasi = $renaksi->jenis_target === 'kuantitatif'
            ? trim(($renaksi->realisasi_nilai ?? '-') . ' ' . ($renaksi->target_satuan ?? ''))
            : ($renaksi->realisasi ?? '-');

        return <<<PROMPT
Berdasarkan data rencana aksi berikut, susun analisis singkat dan rekomendasi tindak lanjut yang konkret dan actionable untuk OPD pengampu.

DATA RENCANA AKSI:
- OPD: {$renaksi->dinas_text}
- Tahun: {$renaksi->tahun}
- Program: {$renaksi->program}
- Kode Program: {$renaksi->kode_program}
- Rencana Aksi: {$renaksi->rencana_aksi}
- Jenis Target: {$renaksi->jenis_target}
- Target: {$target}
- Realisasi: {$realisasi}
- Status: {$renaksi->status}
- Kendala: {$this->orDash($renaksi->kendala)}
- Catatan: {$this->orDash($renaksi->catatan)}
- Indikator terkait:
{$this->orDash($indikators)}

FORMAT JAWABAN (bahasa Indonesia, maksimal 250 kata, tanpa pembuka/penutup):
**Analisis:** 2-3 kalimat penilaian terhadap capaian/status saat ini.
**Rekomendasi:** 3-5 poin tindak lanjut konkret (bullet point), spesifik untuk OPD dan kendala yang disebutkan.
PROMPT;
    }

    private function orDash(?string $value): string
    {
        $v = trim((string) $value);
        return $v === '' ? '-' : $v;
    }
}
