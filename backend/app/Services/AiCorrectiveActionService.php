<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P5 — Corrective Action Generator.
 * Mengubah hasil analisis (P1/P3/P4) menjadi action tracker yang dapat
 * diverifikasi. Input utama adalah HASIL ANALISIS yang sudah tersimpan,
 * sehingga prompt ini bersifat chaining (bergantung pada prompt lain).
 */
class AiCorrectiveActionService
{
    /**
     * Sumber analisis yang bisa dijadikan bahan P5.
     */
    public const SUMBER_VALID = ['P1', 'P3', 'P4'];

    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan corrective action plan untuk satu indikator pada satu tahun,
     * berdasarkan hasil analisis sumber (P1/P3/P4).
     * Melempar \RuntimeException bila konfigurasi/panggilan gagal atau
     * hasil analisis sumber belum ada.
     */
    public function generate(Indikator $indikator, string $tahun, string $hasilAnalisis, string $sumber): string
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
                    ['role' => 'user', 'content' => $this->buildPrompt($indikator, $tahun, $hasilAnalisis, $sumber)],
                ],
                'temperature' => 0.3,
                'max_tokens' => 3000,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Sumopod API error: ' . $response->status() . ' ' . $response->body());
        }

        $text = $response->json('choices.0.message.content');
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Sumopod tidak mengembalikan teks action plan.');
        }

        return trim($text);
    }

    /**
     * Susun user prompt P5 mengikuti template resmi "CORRECTIVE ACTION PLAN".
     */
    private function buildPrompt(Indikator $indikator, string $tahun, string $hasilAnalisis, string $sumber): string
    {
        $indikator->loadMissing(['opds']);

        $ganti = $this->petakan($indikator, $tahun, $hasilAnalisis, $sumber);

        // ────────────────────────────────────────────────────────────────────
        // CATATAN: prompt ini tidak punya placeholder yang dinonaktifkan.
        //
        // {{HASIL_ANALISIS}} diisi dari hasil P1/P3/P4 yang TERSIMPAN di tabel
        // ai_analyses (bukan di-generate ulang di sini). Controller menolak
        // (422) bila hasil sumber belum ada — P5 tidak pernah berjalan tanpa
        // bahan, sesuai prinsip "jangan mengarang".
        //
        // Daftar OPD dilampirkan agar PIC yang ditulis AI merujuk dinas nyata
        // (menghindari PIC abstrak seperti "OPD terkait").
        // ────────────────────────────────────────────────────────────────────
        $template = <<<'PROMPT'
Berdasarkan temuan berikut:

{{HASIL_ANALISIS}}

Susun CORRECTIVE ACTION PLAN.

Konteks indikator: {{INDIKATOR}} (tahun {{TAHUN}})
OPD yang tertaut pada indikator ini: {{OPD_TERTAUT}}
(Gunakan hanya OPD di atas sebagai PIC; bila tindakan membutuhkan pihak di luar daftar, tulis nama resminya dan tandai sebagai eskalasi.)

Setiap tindakan wajib:
- spesifik;
- berada dalam kewenangan OPD;
- memiliki PIC;
- memiliki tenggat;
- memiliki output;
- memiliki evidence;
- dapat diverifikasi selesai/tidak selesai.

Status awal seluruh tindakan: OPEN.

Jangan menulis rekomendasi abstrak.
Gunakan kata kerja:
menetapkan, memvalidasi, merevisi, memetakan, mengintegrasikan, mengalihkan, menargetkan,
menutup, memverifikasi, mengeskalasi.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Corrective Action Plan — daftar bernomor; setiap nomor berisi sub-label:
   1. Temuan: <temuan dari hasil analisis yang ditindaklanjuti>
      Root Cause: <akar masalah yang dirujuk>
      Corrective Action: <tindakan spesifik, diawali kata kerja dari daftar>
      PIC: <OPD/unit pemilik tindakan>
      Deadline: <tanggal/periode konkret>
      Output: <hasil yang harus ada>
      Evidence: <bukti penyelesaian yang dapat diverifikasi>
      Status: OPEN

B. Ringkasan Eksekusi — satu paragraf singkat: tindakan mana yang paling menentukan
   dan apa yang harus dipastikan pimpinan agar tracker ini tidak berhenti di kertas.

Catatan penggunaan: mengubah hasil analisis menjadi action tracker yang dapat diverifikasi.
PROMPT;

        return strtr($template, $ganti);
    }

    /**
     * Petakan placeholder template ke data nyata.
     *
     * @return array<string, string>
     */
    private function petakan(Indikator $indikator, string $tahun, string $hasilAnalisis, string $sumber): array
    {
        $namaOpds = $indikator->opds->pluck('nama_opd')->filter()->values();
        $opdTertaut = $namaOpds->implode(', ') ?: 'Belum ada OPD tertaut';

        return [
            '{{HASIL_ANALISIS}}' => "[Hasil {$sumber} — {$indikator->kode}, tahun {$tahun}]\n" . $hasilAnalisis,
            '{{INDIKATOR}}'      => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator),
            '{{TAHUN}}'          => $tahun,
            '{{OPD_TERTAUT}}'    => $opdTertaut,
        ];
    }
}
