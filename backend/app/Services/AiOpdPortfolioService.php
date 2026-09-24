<?php

namespace App\Services;

use App\Models\Opd;
use Illuminate\Support\Facades\Http;

/**
 * P2 — OPD Portfolio Review (ANALISIS PORTOFOLIO PJPK OPD).
 * Merakit seluruh indikator yang diampu satu OPD (status, tren, gap, kegiatan)
 * lalu memanggil Sumopod dengan P0 sebagai system prompt.
 */
class AiOpdPortfolioService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P2 untuk satu OPD pada satu tahun.
     * Melempar \RuntimeException bila konfigurasi/panggilan gagal.
     */
    public function generate(Opd $opd, string $tahun): string
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
                    ['role' => 'user', 'content' => $this->buildPrompt($opd, $tahun)],
                ],
                'temperature' => 0.3,
                'max_tokens' => 2600,
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
     * Susun user prompt P2 mengikuti template resmi "ANALISIS PORTOFOLIO PJPK OPD".
     *
     * CATATAN PENONAKTIFAN/ADAPTASI (komentar ini TIDAK dikirim ke AI):
     *  - Tidak ada data anggaran & output agregat per OPD → bagian "hubungan
     *    realisasi kegiatan dan outcome" dinilai dari status renaksi + capaian
     *    indikator, bukan dari anggaran (melarang mengarang, sesuai P0 #1/#2).
     *  - Tabel pada format B & D diubah menjadi daftar naratif bernomor berlabel
     *    (permintaan user agar mudah dibaca — bukan tabel "|").
     */
    private function buildPrompt(Opd $opd, string $tahun): string
    {
        $ganti = $this->petakan($opd, $tahun);

        $template = <<<'PROMPT'
ANALISIS PORTOFOLIO PJPK OPD

OPD: {{NAMA_OPD}}
Tahun: {{TAHUN}}

Indikator yang Diampu (beserta status, capaian, tren, dan kegiatan):
{{TABEL_SELURUH_INDIKATOR_OPD}}

Lakukan evaluasi LINTAS INDIKATOR. Jangan hanya menjelaskan indikator satu per satu.

Identifikasi:
1. pola umum kinerja OPD;
2. indikator yang konsisten tercapai;
3. indikator yang stagnan;
4. indikator yang memburuk;
5. masalah yang muncul berulang;
6. hubungan antara realisasi kegiatan dan outcome;
7. kegiatan dengan realisasi tinggi tetapi outcome rendah;
8. masalah yang dapat diselesaikan OPD sendiri;
9. masalah yang membutuhkan OPD lain;
10. tiga prioritas perbaikan terbesar.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):
A. Executive Assessment OPD — 1 paragraf penilaian umum portofolio.
B. Portfolio Performance — daftar bernomor per indikator; setiap nomor berisi sub-label:
   1. Indikator: <kode — nama>
      Status: <status & warna tahun ini>
      Tren: <arah pergerakan singkat>
      Gap Utama: <gap inti>
      Priority: <Tinggi/Sedang/Rendah>
C. Tiga Critical Gaps — daftar bernomor (1..3), tiap poin berisi sub-label:
   1. Gap: <uraian>
      Jenis Gap: <kategori>
      Dampak: <dampak bila tidak dikoreksi>
D. Tiga Priority Actions — daftar bernomor (1..3), tiap poin berisi sub-label:
   1. Action: <tindakan konkret>
      PIC: <pemilik>
      Deadline: <tenggat>
      Expected Result: <hasil yang diharapkan>
      Evidence: <bukti penyelesaian>
E. Cross-OPD Dependencies — daftar bernomor masalah yang butuh OPD lain; sebutkan OPD dan peran spesifiknya. Bila tidak ada, tulis "Tidak ada."
F. Executive Escalation — bila ada isu yang perlu keputusan pimpinan, tulis; bila tidak, tulis "Tidak ada."
G. Kesimpulan — satu kata: ON TRACK / NEEDS ATTENTION / CRITICAL, plus 1 kalimat alasan.
PROMPT;

        return strtr($template, $ganti);
    }

    /**
     * Petakan placeholder template ke data nyata OPD.
     *
     * @return array<string, string>
     */
    private function petakan(Opd $opd, string $tahun): array
    {
        // Seluruh indikator yang diampu OPD ini (pivot indikator_opd, fallback opd_id)
        $indikators = $opd->indikators()->with('pilar')->orderBy('no_urut')->get();
        if ($indikators->isEmpty()) {
            $indikators = \App\Models\Indikator::where('opd_id', $opd->id)->with('pilar')->orderBy('no_urut')->get();
        }

        $barisIndikator = $indikators->map(function ($ind) use ($tahun) {
            $tc = $ind->targetCapaians()->where('tahun', $tahun)->first();
            $target  = $tc?->target ?? null;
            $capaian = $tc?->capaian ?? null;
            $status  = $tc ? trim(($tc->status_tl ?? '') . ' ' . ($tc->warna_tl ?? '')) ?: 'Belum diisi' : 'Belum ada data';

            // % capaian sadar arah indikator
            $persen = null;
            $tNum = is_numeric($target) ? (float) $target : null;
            $cNum = is_numeric($capaian) ? (float) $capaian : null;
            $arahMentah = strtolower((string) ($ind->arah_target ?? ''));
            $lower = str_contains($arahMentah, 'turun') || str_contains($arahMentah, 'rendah') || str_contains($arahMentah, 'lower');
            if ($tNum !== null && $cNum !== null) {
                if ($lower && $cNum != 0.0) $persen = round(($tNum / $cNum) * 100, 1);
                elseif (! $lower && $tNum != 0.0) $persen = round(($cNum / $tNum) * 100, 1);
            }

            // Tren: tahun analisis + 2 tahun sebelumnya (mundur dari tahun tsb)
            $tahunInt = (int) $tahun;
            $trenRows = $ind->targetCapaians()
                ->whereBetween('tahun', [(string) ($tahunInt - 2), $tahun])
                ->orderBy('tahun', 'desc')->get();
            $tren = $trenRows->isEmpty()
                ? 'belum ada riwayat'
                : $trenRows->map(fn ($t) => $t->tahun . ':' . ($t->capaian ?? '-'))->implode(' ← ');

            // Kegiatan/renaksi terkait indikator ini pada tahun tsb (dari renaksi_programs)
            $jmlRenaksi = \App\Models\RenaksiProgram::where('tahun', $tahun)
                ->whereHas('indikators', fn($q) => $q->where('indikators.id', $ind->id))
                ->count();

            // Tandai capaian yang berada di luar rentang wajar (0–200%) sebagai
            // kandidat salah skala data, supaya AI tidak menyimpulkan berlebihan.
            $pct = '-';
            if ($persen !== null) {
                $pct = $persen . '%';
                if ($persen > 200) {
                    $pct .= ' (perlu verifikasi — indikasi beda satuan/skala data)';
                }
            }
            $t   = $target === null ? '-' : $target;
            $c   = $capaian === null ? '-' : $capaian;
            $sat = trim((string) ($ind->satuan ?? ''));

            return "- [{$ind->kode}] {$ind->nama_indikator} ({$ind->pilar?->nama_pilar})\n"
                . "    Target {$t}{$this->sp($sat)} → Realisasi {$c}{$this->sp($sat)} | Capaian {$pct} | Status: {$status}\n"
                . "    Tren 3 thn: {$tren} | Kegiatan tercatat thn ini: {$jmlRenaksi}";
        })->implode("\n");

        if ($barisIndikator === '') {
            $barisIndikator = '(OPD ini tidak mengampu indikator PJPK — tidak dapat dianalisis)';
        }

        return [
            '{{NAMA_OPD}}'                  => $opd->nama_opd,
            '{{TAHUN}}'                     => $tahun,
            '{{TABEL_SELURUH_INDIKATOR_OPD}}' => $barisIndikator,
        ];
    }

    /** Spasi sebelum satuan bila satuan tidak kosong. */
    private function sp(string $satuan): string
    {
        return $satuan === '' ? '' : ' ' . $satuan;
    }
}
