<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P3 — Root Cause Analysis.
 * Merakit data satu indikator sesuai template resmi lalu memanggil Sumopod
 * dengan P0 sebagai system prompt. Digunakan ketika gap besar, tren memburuk,
 * atau akar masalah belum jelas.
 */
class AiRootCauseAnalysisService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P3 untuk satu indikator pada satu tahun.
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
     * Susun user prompt P3 mengikuti template resmi "ROOT CAUSE ANALYSIS".
     * Placeholder yang datanya belum tersedia di DB dinonaktifkan (lihat catatan).
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        // ────────────────────────────────────────────────────────────────────
        // CATATAN PENONAKTIFAN FIELD (data belum tersedia di DB).
        //
        // Komentar PHP ini TIDAK ikut terkirim ke AI. Tiga placeholder dari
        // template resmi dinonaktifkan (dihapus dari teks yang dikirim) karena
        // datanya memang belum ada, sesuai prinsip "jangan dipaksakan":
        //
        //   1. Output ({{OUTPUT}})
        //      Alasan: template resmi meminta "Output" terpisah, tetapi yang
        //      tersedia di DB adalah target/realisasi output per kegiatan —
        //      sudah termasuk di dalam {{KEGIATAN}}. Menulis placeholder
        //      terpisah akan mengulang data yang sama.
        //
        //   2. Kendala ({{KENDALA}})
        //      Alasan: kolom `kendala` di tabel indikators belum diisi
        //      (NULL di semua baris). AI diarahkan mengidentifikasi kendala
        //      dari status kegiatan dan gap yang tersedia.
        //      Aktifkan kembali bila kolom kendala mulai diisi.
        //
        //   3. Data Pendukung ({{DATA_PENDUKUNG}})
        //      Alasan: belum ada mekanisme lampiran/dokumen pendukung
        //      per indikator di sistem.
        //
        // Untuk mengaktifkan lagi: tambahkan kembali baris placeholder di template
        // di bawah DAN isi nilainya di method petakan().
        // ────────────────────────────────────────────────────────────────────
        $template = <<<'PROMPT'
LAKUKAN ROOT CAUSE ANALYSIS TERHADAP INDIKATOR:

Indikator: {{INDIKATOR}}
Target: {{TARGET}}
Realisasi: {{REALISASI}}
Tren: {{TREND}}
Kegiatan: {{KEGIATAN}}

Pisahkan penyebab menjadi:
1. faktor langsung;
2. faktor struktural;
3. faktor implementasi;
4. faktor koordinasi;
5. faktor data;
6. faktor eksternal.

Jangan menyatakan suatu faktor sebagai penyebab apabila bukti tidak cukup.
Gunakan label "hipotesis yang perlu diverifikasi".

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Peta Faktor Penyebab — daftar bernomor; setiap nomor berisi sub-label:
   1. Faktor: <uraian singkat faktor>
      Bukti: <bukti dari data yang tersedia>
      Jenis Penyebab: <salah satu dari 6 kategori di atas>
      Tingkat Pengaruh: <Tinggi/Sedang/Rendah>
      Tingkat Keyakinan: <Tinggi/Sedang/Rendah — atau "hipotesis yang perlu diverifikasi">

B. Root Causes Utama (maksimal 3) — daftar bernomor; setiap nomor berisi sub-label:
   1. Root Cause: <uraian singkat>
      Mengapa Penting: <alasan faktor ini paling menentukan>
      Data Tambahan Diperlukan: <data yang harus dikumpulkan untuk verifikasi>
      Intervensi Paling Relevan: <tindakan konkret yang disarankan>

Catatan penggunaan: analisis ini digunakan ketika gap besar, tren memburuk, atau akar masalah belum jelas.
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
        // ── Arah kinerja (untuk interpretasi gap yang benar) ────────────────
        $arahMentah = strtolower(trim((string) ($indikator->arah_target ?? '')));
        $arah = match (true) {
            str_contains($arahMentah, 'naik'), str_contains($arahMentah, 'tinggi'), str_contains($arahMentah, 'higher')
                => 'Semakin tinggi semakin baik (higher is better)',
            str_contains($arahMentah, 'turun'), str_contains($arahMentah, 'rendah'), str_contains($arahMentah, 'lower')
                => 'Semakin rendah semakin baik (lower is better)',
            default => 'Kontekstual / jaga stabilitas (arah tidak naik/turun tegas)',
        };

        // ── Riwayat target/capaian ─────────────────────────────────────────
        $riwayat = $indikator->targetCapaians()->orderBy('tahun')->get();
        $tahunIni = $riwayat->firstWhere('tahun', $tahun);

        $fmt = fn ($v) => $v === null || $v === '' ? 'Belum tersedia' : (string) $v;

        $target   = $tahunIni?->target;
        $capaian  = $tahunIni?->capaian;
        $satuan   = trim((string) ($indikator->satuan ?? ''));

        // Tren seluruh tahun yang tersedia (RCA butuh konteks historis penuh)
        $tren = $riwayat->map(function ($t) use ($fmt) {
            $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? '')) ?: '-';
            return "{$t->tahun}: target {$fmt($t->target)} → realisasi {$fmt($t->capaian)} ({$status})";
        })->implode('; ') ?: 'Belum tersedia';

        // ── Kegiatan / rencana aksi terkait tahun ini ──────────────────────
        // Sumber: renaksi_programs (tertaut via pivot indikator_renaksi_program).
        // Termasuk target & realisasi output per kegiatan + status.
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->whereHas('indikators', fn($q) => $q->where('indikators.id', $indikator->id))
            ->orderBy('no')
            ->get();

        $kegiatan = $renaksiProgram->map(function ($r) {
            $opd = $r->dinas_text ?? $r->opd?->nama_opd ?? '-';
            $prog = trim((string) ($r->program ?? ''));
            $prog = $prog === '' ? '' : " [Program: {$prog}]";
            $out = $r->jenis_target === 'kuantitatif'
                ? trim(($r->realisasi_nilai ?? '') . '/' . ($r->target_nilai ?? '') . ' ' . ($r->target_satuan ?? ''))
                : trim(($r->realisasi ?? '') . '/' . ($r->target ?? ''));
            $out = trim($out, '/ ');
            $out = $out === '' ? '' : " [Output: {$out}]";
            return "{$r->rencana_aksi}{$prog} — {$opd} ({$r->status}){$out}";
        })->implode('; ') ?: 'Belum tersedia';

        return [
            '{{INDIKATOR}}' => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator)
                . ' | Arah: ' . $arah,
            '{{TARGET}}'    => $fmt($target) . ($satuan && $target !== null ? " {$satuan}" : ''),
            '{{REALISASI}}' => $fmt($capaian) . ($satuan && $capaian !== null ? " {$satuan}" : ''),
            '{{TREND}}'     => $tren,
            '{{KEGIATAN}}'  => $kegiatan,
            // NONAKTIF — {{OUTPUT}}, {{KENDALA}}, {{DATA_PENDUKUNG}}: data belum
            // tersedia / sudah tercakup di {{KEGIATAN}} (lihat catatan di
            // buildPrompt). Placeholder-nya sudah dihapus dari template,
            // jadi tidak dikirim ke AI.
        ];
    }
}
