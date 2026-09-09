<?php

namespace App\Services;

use App\Models\Pilar;
use Illuminate\Support\Facades\Http;

/**
 * P12 — Cross-Pillar Strategic Synthesis (SINTESIS KINERJA PJPK).
 * Berbeda dari prompt lain: tidak per indikator, melainkan membaca SELURUH
 * pilar & indikator sekaligus untuk menemukan pola lintas pilar. Dipakai
 * pada executive dashboard untuk Sekda/Bappeda.
 *
 * Satu hasil per tahun (indikator_id NULL di ai_analyses).
 */
class AiCrossPillarService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan sintesis P12 untuk satu tahun (seluruh pilar).
     * Melempar \RuntimeException bila konfigurasi/panggilan gagal.
     */
    public function generate(string $tahun): string
    {
        $apiKey = config('services.sumopod.api_key');
        if (empty($apiKey)) {
            throw new \RuntimeException('API key Sumopod belum dikonfigurasi (SUMOPOD_API_KEY di .env).');
        }

        $baseUrl = rtrim((string) config('services.sumopod.base_url'), '/');
        $model = config('services.sumopod.model');

        $response = Http::timeout(120)
            ->withToken($apiKey)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $this->promptLibrary->master()],
                    ['role' => 'user', 'content' => $this->buildPrompt($tahun)],
                ],
                'temperature' => 0.3,
                'max_tokens' => 4000,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Sumopod API error: ' . $response->status() . ' ' . $response->body());
        }

        $text = $response->json('choices.0.message.content');
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Sumopod tidak mengembalikan teks sintesis.');
        }

        return trim($text);
    }

    /**
     * Susun user prompt P12 mengikuti template resmi "SINTESIS KINERJA PJPK".
     * {{DATA_LIMA_PILAR}} diisi rangkuman seluruh pilar yang dihitung sistem.
     */
    private function buildPrompt(string $tahun): string
    {
        $template = <<<'PROMPT'
LAKUKAN SINTESIS KINERJA PJPK KABUPATEN SIDOARJO

Data seluruh pilar (tahun {{TAHUN}}):
{{DATA_LIMA_PILAR}}

Jangan hanya merangkum indikator satu per satu.
Identifikasi POLA LINTAS PILAR.

Analisis:
1. tiga capaian strategis terkuat;
2. tiga masalah paling kritis;
3. indikator yang saling berkaitan;
4. tekanan demografi yang muncul;
5. masalah struktural lintas OPD;
6. indikator yang berpotensi tidak mencapai target;
7. kebutuhan perubahan kebijakan;
8. kebutuhan intervensi wilayah;
9. prioritas 100 hari;
10. isu yang membutuhkan keputusan Sekda.

Kelompokkan isu bila relevan: bonus demografi; kualitas SDM; ketenagakerjaan; kemiskinan dan
ketimpangan; ketahanan keluarga; aging population; mobilitas dan kepadatan; administrasi/data
kependudukan.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. EXECUTIVE STATE OF PJPK
   Satu paragraf: kondisi keseluruhan PJPK tahun ini — bukan daftar indikator,
   melainkan pola besar yang terlihat lintas pilar.

B. THREE STRATEGIC GAINS
   Daftar bernomor (maksimal 3): capaian strategis terkuat, masing-masing dengan
   bukti dan pilar asalnya.

C. THREE CRITICAL RISKS
   Daftar bernomor (maksimal 3): masalah paling kritis, masing-masing dengan bukti,
   pilar asal, dan kelompok isu (bonus demografi / kualitas SDM / ketenagakerjaan /
   kemiskinan dan ketimpangan / ketahanan keluarga / aging population / mobilitas
   dan kepadatan / administrasi data kependudukan).

D. CROSS-PILLAR INTERDEPENDENCIES
   Daftar bernomor: indikator yang saling berkaitan lintas pilar — jelaskan arah
   keterkaitannya (indikator A mempengaruhi indikator B melalui apa), bukan sekadar
   menyebut nama.

E. TOP 5 POLICY ACTIONS
   Daftar bernomor (maksimal 5); setiap nomor berisi sub-label:
   1. Priority: <P1 (0–3 bulan) / P2 (tahun berjalan) / P3 (siklus berikutnya)>
      Action: <tindakan konkret>
      Lead OPD: <pemilik utama>
      Supporting OPD: <pendukung>
      Horizon: <periode pelaksanaan>

F. EXECUTIVE DECISIONS REQUIRED
   Daftar bernomor isu yang membutuhkan keputusan Sekda, masing-masing satu kalimat
   keputusan yang diminta. Bila tidak ada, tulis "Tidak memerlukan eskalasi pada
   tahap ini."

Catatan penggunaan: dipakai pada executive dashboard untuk membaca pola lintas pilar.
PROMPT;

        return strtr($template, [
            '{{TAHUN}}'          => $tahun,
            '{{DATA_LIMA_PILAR}}' => $this->dataLimaPilar($tahun),
        ]);
    }

    /**
     * Rangkum seluruh pilar + indikator + status tahun terpilih jadi teks
     * ringkas per pilar. Dihitung sistem (bukan dinilai AI).
     */
    private function dataLimaPilar(string $tahun): string
    {
        $pilars = Pilar::with(['indikators' => function ($q) use ($tahun) {
            $q->orderBy('no_urut')->with(['targetCapaians' => fn ($t) => $t->where('tahun', $tahun), 'opds:id,nama_opd']);
        }])->orderBy('id')->get();

        $bagian = [];
        foreach ($pilars as $pilar) {
            $baris = ["## {$pilar->nama_pilar}"];
            foreach ($pilar->indikators as $ind) {
                $tc = $ind->targetCapaians->first();
                $target    = $tc?->target ?? null;
                $capaian   = $tc?->capaian ?? null;
                $status    = $tc ? (trim(($tc->status_tl ?? '') . ' ' . ($tc->warna_tl ?? '')) ?: 'Belum diisi') : 'Tidak ada data';
                $opd       = $ind->opds->pluck('nama_opd')->implode(', ') ?: '-';
                $satuan    = trim((string) ($ind->satuan ?? ''));

                $nilai = 'target ' . ($target ?? '-') . ' → realisasi ' . ($capaian ?? '-')
                    . ($satuan ? " {$satuan}" : '');
                $baris[] = "- {$ind->kode} {$ind->nama_indikator}: {$nilai} [{$status}] (OPD: {$opd})";
            }
            $bagian[] = implode("\n", $baris);
        }

        return implode("\n\n", $bagian) ?: 'Belum tersedia';
    }
}
