<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P7 — Data Gap Analysis (STATUS DATA INDIKATOR: BELUM MEMADAI).
 * Dipanggil untuk indikator yang datanya kosong / belum tervalidasi.
 * AI DILARANG menyimpulkan indikator berhasil/gagal — fokus murni pada
 * tata kelola data: apa yang hilang, mengapa, siapa menutup, kapan.
 */
class AiDataGapService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P7 untuk satu indikator pada satu tahun.
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
     * Susun user prompt P7 mengikuti template resmi "STATUS DATA INDIKATOR:
     * BELUM MEMADAI". Semua placeholder punya sumber data nyata (dihitung
     * sistem), jadi tidak ada yang dinonaktifkan.
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        $template = <<<'PROMPT'
STATUS DATA INDIKATOR: BELUM MEMADAI

Indikator: {{INDIKATOR}}
Data yang tersedia: {{DATA_TERSEDIA}}
Data yang belum tersedia: {{DATA_KOSONG}}
Sumber yang direncanakan: {{SUMBER_DATA}}
OPD/Data Owner: {{DATA_OWNER}}

Jangan menyimpulkan apakah indikator berhasil atau gagal.

Analisis:
1. jenis data yang belum tersedia;
2. apakah masalah berada pada definisi, formula, numerator, denominator, sumber, periode,
   keterlambatan pelaporan, atau validasi;
3. risiko terhadap keputusan kebijakan;
4. tindakan untuk menutup data gap;
5. siapa yang bertanggung jawab;
6. tenggat;
7. bukti validasi.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Peta Data Gap — daftar bernomor; setiap nomor berisi sub-label:
   1. Data Gap: <jenis data yang belum tersedia>
      Penyebab: <definisi / formula / numerator / denominator / sumber / periode /
                 keterlambatan pelaporan / validasi — pilih yang paling tepat + alasan>
      Data Owner: <OPD/unit penanggung jawab>
      Tindakan: <tindakan konkret untuk menutup gap>
      Deadline: <tanggal/periode konkret>
      Evidence: <bukti validasi yang dapat diperiksa>

B. Risiko terhadap Keputusan Kebijakan
   Satu paragraf: keputusan apa yang saat ini terpaksa dibuat tanpa data, dan apa
   konsekuensinya bila gap ini tidak ditutup sebelum siklus perencanaan berikutnya.

C. Penutup
   DATA GOVERNANCE RISK = LOW / MEDIUM / HIGH — pilih satu, disertai satu kalimat alasan.

Catatan penggunaan: analisis ini dipanggil karena data indikator kosong atau belum tervalidasi.
PROMPT;

        return strtr($template, $ganti);
    }

    /**
     * Petakan placeholder template ke data nyata indikator.
     * DATA_TERSEDIA & DATA_KOSONG dihitung sistem dari target_capaians
     * dan status pengisian renaksi — bukan dinilai AI.
     *
     * @return array<string, string>
     */
    private function petakan(Indikator $indikator, string $tahun): array
    {
        $fmt = fn ($v) => $v === null || $v === '' ? null : (string) $v;

        // ── Inventaris data per tahun ──────────────────────────────────────
        $riwayat = $indikator->targetCapaians()->orderBy('tahun')->get();
        $satuan  = trim((string) ($indikator->satuan ?? ''));

        $tersedia = [];
        $kosong   = [];

        // Baseline
        $baseline = $fmt($indikator->baseline_2024);
        if ($baseline !== null) {
            $tersedia[] = "baseline 2024 = {$baseline}" . ($satuan ? " {$satuan}" : '');
        } else {
            $kosong[] = 'baseline 2024';
        }

        foreach ($riwayat as $t) {
            $th = $t->tahun;
            if ($fmt($t->target) !== null) {
                $tersedia[] = "target {$th}";
            } else {
                $kosong[] = "target {$th}";
            }
            if ($fmt($t->capaian) !== null) {
                $tersedia[] = "realisasi {$th}";
            } else {
                $kosong[] = "realisasi {$th}";
            }
            $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? ''));
            if ($th === $tahun) {
                $tersedia[] = 'status tahun ini: ' . ($status !== '' ? $status : 'belum diisi');
            }
        }

        // ── Renaksi tahun terpilih: ketersediaan data kegiatan ─────────────
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->whereHas('indikators', fn($q) => $q->where('indikators.id', $indikator->id))
            ->get();

        $totalRenaksi = $renaksiProgram->count();
        $renaksiKosong = $renaksiProgram->filter(function ($r) {
            $nilai = $r->jenis_target === 'kuantitatif' ? $r->realisasi_nilai : $r->realisasi;
            return ($nilai === null || trim((string) $nilai) === '') || ($r->status ?? 'Belum diisi') === 'Belum diisi';
        })->count();

        if ($totalRenaksi === 0) {
            $kosong[] = "data kegiatan/renaksi tahun {$tahun} (belum ada renaksi tertaut)";
        } elseif ($renaksiKosong > 0) {
            $tersedia[] = "{$totalRenaksi} renaksi tertaut tahun {$tahun}";
            $kosong[]   = "realisasi {$renaksiKosong} dari {$totalRenaksi} renaksi tahun {$tahun} belum diisi";
        } else {
            $tersedia[] = "{$totalRenaksi} renaksi tertaut tahun {$tahun} (semua terisi)";
        }

        // ── OPD / data owner ───────────────────────────────────────────────
        $namaOpds = $indikator->opds->pluck('nama_opd')->filter()->values();
        $dataOwner = $namaOpds->implode(', ') ?: 'Belum ada OPD tertaut (data owner belum jelas — gap tersendiri)';

        return [
            '{{INDIKATOR}}'     => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator)
                . ' | Satuan: ' . ($satuan !== '' ? $satuan : 'belum diisi')
                . ' | Definisi operasional: belum tercatat di sistem',
            '{{DATA_TERSEDIA}}' => $tersedia ? implode('; ', $tersedia) : 'Tidak ada',
            '{{DATA_KOSONG}}'   => $kosong ? implode('; ', $kosong) : 'Tidak ada',
            '{{SUMBER_DATA}}'   => trim((string) ($indikator->sumber_data ?? '')) ?: 'Belum ditetapkan di sistem',
            '{{DATA_OWNER}}'    => $dataOwner,
        ];
    }
}
