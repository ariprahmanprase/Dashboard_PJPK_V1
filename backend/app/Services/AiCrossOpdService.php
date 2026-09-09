<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P9 — Cross-OPD Coordination (ANALISIS KEBUTUHAN KOLABORASI LINTAS OPD).
 * Menetapkan pembagian peran yang spesifik (accountable/data/program owner,
 * supporting OPD) untuk indikator lintas sektor — indikator yang tertaut
 * ke lebih dari satu OPD.
 */
class AiCrossOpdService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P9 untuk satu indikator pada satu tahun.
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
     * Susun user prompt P9 mengikuti template resmi "ANALISIS KEBUTUHAN
     * KOLABORASI LINTAS OPD". Semua placeholder punya sumber data nyata —
     * tidak ada yang dinonaktifkan.
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        $template = <<<'PROMPT'
ANALISIS KEBUTUHAN KOLABORASI LINTAS OPD

Indikator: {{INDIKATOR}}
OPD Utama: {{OPD_UTAMA}}
OPD Pendukung: {{OPD_PENDUKUNG}}
Masalah: {{MASALAH}}
Rencana Aksi: {{RENCANA_AKSI}}

Tentukan:
1. siapa ACCOUNTABLE OWNER;
2. siapa DATA OWNER;
3. siapa PROGRAM OWNER;
4. siapa supporting OPD;
5. kontribusi spesifik masing-masing;
6. ketergantungan antar-OPD;
7. titik koordinasi yang berpotensi menghambat hasil.

Jangan menulis "meningkatkan koordinasi".
Jelaskan bentuk koordinasinya: berbagi data, menyepakati denominator, menyelaraskan sasaran,
mengintegrasikan subkegiatan, joint targeting, atau joint verification.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Struktur Kepemilikan — sub-label per peran:
   Accountable Owner: <OPD + alasan penunjukan>
   Data Owner: <OPD + data yang menjadi tanggung jawabnya>
   Program Owner: <OPD + program yang menjadi tanggung jawabnya>
   Supporting OPD: <daftar OPD pendukung>

B. Pembagian Peran — daftar bernomor per OPD/instansi; setiap nomor berisi sub-label:
   1. OPD/Instansi: <nama>
      Peran: <peran spesifik dalam indikator ini>
      Tindakan: <tindakan konkret yang menjadi tanggung jawabnya>
      Output: <hasil yang harus diserahkan>
      Deadline: <tanggal/periode konkret>

C. Ketergantungan Antar-OPD
   Daftar bernomor: siapa bergantung pada siapa, untuk apa, dan apa risikonya
   bila pihak yang ditunggu terlambat.

D. Titik Koordinasi Kritis
   Daftar bernomor titik yang berpotensi menghambat hasil; untuk setiap titik
   sebutkan bentuk koordinasi yang tepat (berbagi data / menyepakati denominator /
   menyelaraskan sasaran / mengintegrasikan subkegiatan / joint targeting /
   joint verification) dan mekanismenya (forum, jadwal, dokumen kesepakatan).

Catatan penggunaan: menetapkan pembagian peran yang spesifik untuk isu lintas OPD.
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

        // ── OPD utama & pendukung (dari pivot indikator_opd) ───────────────
        $namaOpds = $indikator->opds->pluck('nama_opd')->filter()->values();
        $opdUtama = $namaOpds->first() ?? '-';
        $opdPendukung = $namaOpds->slice(1)->implode(', ') ?: '-';

        // ── Arah kinerja ───────────────────────────────────────────────────
        $arahMentah = strtolower(trim((string) ($indikator->arah_target ?? '')));
        $arah = match (true) {
            str_contains($arahMentah, 'naik'), str_contains($arahMentah, 'tinggi'), str_contains($arahMentah, 'higher')
                => 'Semakin tinggi semakin baik (higher is better)',
            str_contains($arahMentah, 'turun'), str_contains($arahMentah, 'rendah'), str_contains($arahMentah, 'lower')
                => 'Semakin rendah semakin baik (lower is better)',
            default => 'Kontekstual / jaga stabilitas (arah tidak naik/turun tegas)',
        };

        // ── MASALAH: dihitung sistem dari gap, status, tren ────────────────
        $riwayat  = $indikator->targetCapaians()->orderBy('tahun')->get();
        $tahunIni = $riwayat->firstWhere('tahun', $tahun);
        $satuan   = trim((string) ($indikator->satuan ?? ''));

        $statusIni = $tahunIni
            ? trim(($tahunIni->status_tl ?? '') . ' ' . ($tahunIni->warna_tl ?? '')) ?: 'Belum diisi'
            : 'Belum ada data';

        $masalah = "Status {$tahun}: {$statusIni}"
            . " | Target: {$fmt($tahunIni?->target)} | Realisasi: {$fmt($tahunIni?->capaian)}"
            . " | Gap: {$fmt($tahunIni?->gap)}" . ($satuan ? " {$satuan}" : '')
            . ' | Tren: ' . ($riwayat->map(function ($t) use ($fmt) {
                $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? '')) ?: '-';
                return "{$t->tahun}: {$fmt($t->target)} → {$fmt($t->capaian)} ({$status})";
            })->implode('; ') ?: 'Belum tersedia');

        // ── Rencana aksi tahun ini per OPD (inti koordinasi) ───────────────
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->where(function ($q) use ($indikator) {
                foreach (['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'] as $col) {
                    $q->orWhere($col, $indikator->id);
                }
            })
            ->orderBy('no')
            ->get();

        $rencanaAksi = $renaksiProgram->map(function ($r) {
            $opd = $r->dinas_text ?? $r->opd?->nama_opd ?? '-';
            return "{$r->rencana_aksi} — {$opd} ({$r->status})";
        })->implode('; ') ?: 'Belum tersedia';

        return [
            '{{INDIKATOR}}'     => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator)
                . ' | Arah: ' . $arah
                . ' | Satuan: ' . ($satuan !== '' ? $satuan : '-'),
            '{{OPD_UTAMA}}'     => $opdUtama,
            '{{OPD_PENDUKUNG}}' => $opdPendukung,
            '{{MASALAH}}'       => $masalah,
            '{{RENCANA_AKSI}}'  => $rencanaAksi,
        ];
    }
}
