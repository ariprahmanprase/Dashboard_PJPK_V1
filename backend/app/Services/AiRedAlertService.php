<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P6 — Red Indicator Alert (INDIKATOR PJPK BERSTATUS MERAH).
 * Analisis mendalam untuk indikator berstatus merah: menilai apakah gap
 * sementara/struktural, target masih realistis, sampai keputusan eskalasi
 * Sekda. Dipakai saat indikator menyala merah (lihat logic pemanggilan).
 */
class AiRedAlertService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P6 untuk satu indikator pada satu tahun.
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
     * Susun user prompt P6 mengikuti template resmi "INDIKATOR PJPK BERSTATUS MERAH".
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
        //   1. Kendala ({{KENDALA}})
        //      Alasan: kolom `kendala` di tabel indikators belum diisi
        //      (NULL di semua baris). AI diarahkan menilai kendala dari
        //      status kegiatan renaksi, gap, dan tren yang tersedia.
        //      Aktifkan kembali bila kolom kendala mulai diisi —
        //      tambahkan baris "Kendala: {{KENDALA}}" di template DAN
        //      isi nilainya di method petakan().
        // ────────────────────────────────────────────────────────────────────
        $template = <<<'PROMPT'
INDIKATOR PJPK BERSTATUS MERAH

Indikator: {{INDIKATOR}}
Target: {{TARGET}}
Realisasi: {{REALISASI}}
Gap: {{GAP}}
Tren: {{TREND}}
Kegiatan: {{KEGIATAN}}

Lakukan analisis mendalam.

Jawab:
1. apakah gap bersifat sementara atau struktural;
2. apakah target masih realistis;
3. apakah program eksisting masih relevan;
4. apakah masalah berasal dari implementasi atau desain program;
5. apa quick win yang dapat dilakukan dalam 90 hari;
6. apa perubahan yang diperlukan dalam tahun berjalan;
7. apakah perlu redesign untuk tahun berikutnya;
8. apakah perlu eskalasi Sekda.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. ALERT SUMMARY
   Satu paragraf: seberapa serius status merah ini dan apa taruhannya.

B. ROOT CAUSE
   Jawaban pertanyaan 1–4 sebagai daftar bernomor (Sifat Gap / Kerealistisan Target /
   Relevansi Program / Sumber Masalah), masing-masing disertai bukti dari data.

C. 90-DAY ACTION
   Daftar bernomor quick win (jawaban pertanyaan 5); setiap nomor berisi sub-label:
   Tindakan / PIC / Tenggat / Output / Evidence.

D. STRUCTURAL ACTION
   Daftar bernomor perubahan yang diperlukan dalam tahun berjalan (jawaban pertanyaan 6);
   setiap nomor berisi sub-label: Tindakan / PIC / Tenggat / Output / Evidence.

E. CROSS-OPD ACTION
   Bila penyelesaian membutuhkan OPD lain: daftar bernomor berisi sub-label
   OPD / Peran Spesifik / Mekanisme Koordinasi. Bila tidak perlu, tulis satu kalimat
   bahwa penyelesaian cukup dalam kewenangan OPD pengampu.

F. EXECUTIVE ESCALATION
   Jawaban pertanyaan 7–8: perlu redesign tahun berikutnya (ya/tidak + alasan) dan
   perlu eskalasi Sekda (ya/tidak + isu yang dieskalasi). Bila ya, tulis satu kalimat
   keputusan yang diminta dari pimpinan.

G. EVIDENCE REQUIRED
   Daftar bernomor data/bukti yang harus dikumpulkan untuk memverifikasi seluruh
   tindakan di atas.

Catatan penggunaan: analisis ini dipanggil untuk indikator berstatus merah.
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
        // ── Arah kinerja (interpretasi gap merah bergantung arah) ───────────
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
        $gap      = $tahunIni?->gap;
        $satuan   = trim((string) ($indikator->satuan ?? ''));

        $tren = $riwayat->map(function ($t) use ($fmt) {
            $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? '')) ?: '-';
            return "{$t->tahun}: target {$fmt($t->target)} → realisasi {$fmt($t->capaian)} ({$status})";
        })->implode('; ') ?: 'Belum tersedia';

        // ── Kegiatan / rencana aksi terkait tahun ini ──────────────────────
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
                . ' | Arah: ' . $arah
                . ' | OPD: ' . ($indikator->opds->pluck('nama_opd')->filter()->implode(', ') ?: '-'),
            '{{TARGET}}'    => $fmt($target) . ($satuan && $target !== null ? " {$satuan}" : ''),
            '{{REALISASI}}' => $fmt($capaian) . ($satuan && $capaian !== null ? " {$satuan}" : ''),
            '{{GAP}}'       => $fmt($gap) . ($satuan && $gap !== null ? " {$satuan}" : ''),
            '{{TREND}}'     => $tren,
            '{{KEGIATAN}}'  => $kegiatan,
            // NONAKTIF — {{KENDALA}}: kolom kendala belum diisi di DB
            // (lihat catatan di buildPrompt). Placeholder-nya sudah dihapus
            // dari template, jadi tidak dikirim ke AI.
        ];
    }
}
