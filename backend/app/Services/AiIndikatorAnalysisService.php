<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P1 — Indicator Performance Analysis (ANALISIS KINERJA INDIKATOR PJPK).
 * Merakit data satu indikator sesuai template resmi lalu memanggil Sumopod
 * dengan P0 sebagai system prompt.
 */
class AiIndikatorAnalysisService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P1 untuk satu indikator pada satu tahun.
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
                'max_tokens' => 2000,
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
     * Susun user prompt P1 mengikuti template resmi "ANALISIS KINERJA INDIKATOR PJPK".
     * Placeholder yang datanya belum tersedia di DB diisi "Belum tersedia"
     * (P0 melarang mengarang & mewajibkan menandai data gap).
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        // ────────────────────────────────────────────────────────────────────
        // CATATAN PENONAKTIFAN FIELD (data belum tersedia di DB).
        //
        // Komentar PHP ini TIDAK ikut terkirim ke AI. Dua placeholder dari
        // template resmi dinonaktifkan (dihapus dari teks yang dikirim) karena
        // datanya memang belum ada, sesuai prinsip "jangan dipaksakan":
        //
        //   1. Realisasi Anggaran ({{REALISASI_ANGGARAN}})
        //      Alasan: sistem belum punya kolom/tabel anggaran/serapan, sehingga
        //      nilai apa pun akan mengarang (melanggar prinsip P0 #1/#2).
        //      Aktifkan kembali bila sudah ada sumber anggaran per kegiatan.
        //
        //   2. Status Validasi ({{STATUS_VALIDASI}})
        //      Alasan: belum ada status validasi/verifikasi data per indikator.
        //
        // Untuk mengaktifkan lagi: tambahkan kembali baris placeholder di template
        // di bawah DAN isi nilainya di method petakan().
        // ────────────────────────────────────────────────────────────────────
        $template = <<<'PROMPT'
ANALISIS KINERJA INDIKATOR PJPK

Pilar: {{PILAR}}
Indikator: {{INDIKATOR}}
OPD Utama: {{OPD_UTAMA}}
OPD Pendukung: {{OPD_PENDUKUNG}}
Tahun: {{TAHUN}}

Baseline: {{BASELINE}}
Target: {{TARGET}}
Realisasi: {{REALISASI}}
Gap: {{GAP}}
Persentase Capaian: {{PERSENTASE_CAPAIAN}}
Arah Kinerja: {{ARAH_KINERJA}}
Status: {{STATUS}}
Tren 3 Tahun: {{TREND}}

Rencana Aksi: {{RENCANA_AKSI}}
Kegiatan/Subkegiatan: {{KEGIATAN}}
Target Output: {{TARGET_OUTPUT}}
Realisasi Output: {{REALISASI_OUTPUT}}
Kendala: {{KENDALA}}
Sumber Data: {{SUMBER_DATA}}

Lakukan analisis:
1. Jelaskan posisi indikator terhadap target.
2. Analisis tren dan arah pergerakan.
3. Nilai apakah rencana aksi dan kegiatan cukup relevan terhadap outcome indikator.
4. Identifikasi maksimal 3 akar masalah.
5. Identifikasi risiko apabila tidak dikoreksi.
6. Rumuskan tindakan konkret.
7. Tentukan OPD/PIC, waktu, output dan bukti penyelesaian.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):
A. Ringkasan Eksekutif — maksimum 120 kata (paragraf).
B. Diagnosis Kinerja
   Status: [...]
   Interpretasi: [...]
C. Akar Masalah (maksimal 3, tulis sebagai daftar bernomor; setiap nomor berisi sub-label):
   1. Akar Masalah: <uraian singkat>
      Jenis Gap: <kategori gap>
      Bukti/Indikasi: <bukti dari data>
      Tingkat Keyakinan: <Tinggi/Sedang/Rendah>
D. Rekomendasi (daftar bernomor; setiap nomor berisi sub-label):
   1. Prioritas: <P1/P2/P3>
      Tindakan Konkret: <tindakan spesifik>
      OPD/PIC: <pemilik>
      Waktu: <tenggat>
      Output: <hasil>
      Evidence: <bukti penyelesaian>
   Gunakan P1 = 0–3 bulan; P2 = tahun berjalan; P3 = siklus perencanaan berikutnya.
E. Executive Attention
   Satu kalimat tentang hal yang membutuhkan perhatian pimpinan.
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
        // ── OPD utama & pendukung (dari pivot indikator_opd) ────────────────
        $namaOpds = $indikator->opds->pluck('nama_opd')->filter()->values();
        $opdUtama = $namaOpds->first() ?? '-';
        $opdPendukung = $namaOpds->slice(1)->implode(', ') ?: '-';

        // ── Arah kinerja (petakan nilai DB ke bahasa yang dipahami AI) ──────
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

        // Persentase capaian = realisasi/target × 100 (mengikuti arah indikator).
        // Untuk lower-is-better, capaian = target/realisasi × 100.
        $persen = null;
        $tNum = is_numeric($target) ? (float) $target : null;
        $cNum = is_numeric($capaian) ? (float) $capaian : null;
        if ($tNum !== null && $cNum !== null) {
            $lowerIsBetter = str_contains($arah, 'rendah');
            if ($lowerIsBetter && $cNum != 0.0) {
                $persen = round(($tNum / $cNum) * 100, 1);
            } elseif (! $lowerIsBetter && $tNum != 0.0) {
                $persen = round(($cNum / $tNum) * 100, 1);
            }
        }

        $statusTahunIni = $tahunIni
            ? trim(($tahunIni->status_tl ?? '') . ' ' . ($tahunIni->warna_tl ?? '')) ?: 'Belum diisi'
            : 'Belum ada data (data governance risk)';

        // Tren 3 tahun terakhir (termasuk tahun terpilih bila ada)
        $tren = $riwayat->map(function ($t) use ($fmt) {
            $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? '')) ?: '-';
            return "{$t->tahun}: target {$fmt($t->target)} → realisasi {$fmt($t->capaian)} ({$status})";
        })->implode('; ') ?: 'Belum tersedia';

        // ── Kegiatan / rencana aksi terkait tahun ini ──────────────────────
        // Sumber: tabel renaksi_programs (data yang diisi admin OPD, tertaut ke
        // indikator via pivot indikator_renaksi_program) — lebih hidup daripada
        // tabel `renaksi` lama. Diambil per indikator + tahun, lintas OPD.
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->whereHas('indikators', fn($q) => $q->where('indikators.id', $indikator->id))
            ->orderBy('no')
            ->get();

        $rencanaAksi = $renaksiProgram->map(fn ($r) => $r->rencana_aksi)
            ->filter()->implode('; ') ?: 'Belum tersedia';

        // Kegiatan = program + rencana aksi + OPD pelaksana + status
        $kegiatan = $renaksiProgram->map(function ($r) {
            $opd = $r->dinas_text ?? $r->opd?->nama_opd ?? '-';
            $prog = trim((string) ($r->program ?? ''));
            $prog = $prog === '' ? '' : " [Program: {$prog}]";
            return "{$r->rencana_aksi}{$prog} — {$opd} ({$r->status})";
        })->implode('; ') ?: 'Belum tersedia';

        // Target/realisasi output per kegiatan (mengikuti jenis_target)
        $targetOutput = $renaksiProgram->map(function ($r) {
            $t = $r->jenis_target === 'kuantitatif'
                ? trim(($r->target_nilai ?? '') . ' ' . ($r->target_satuan ?? '')) ?: null
                : $r->target;
            return $t ? "{$r->rencana_aksi}: {$t}" : null;
        })->filter()->implode('; ') ?: 'Belum tersedia';

        $realisasiOutput = $renaksiProgram->map(function ($r) {
            $t = $r->jenis_target === 'kuantitatif'
                ? trim(($r->realisasi_nilai ?? '') . ' ' . ($r->target_satuan ?? '')) ?: null
                : $r->realisasi;
            $st = $r->status ?? '-';
            return $t ? "{$r->rencana_aksi}: {$t} [{$st}]" : "{$r->rencana_aksi} [{$st}]";
        })->implode('; ') ?: 'Belum tersedia';

        return [
            '{{PILAR}}'              => (string) ($indikator->pilar?->nama_pilar ?? '-'),
            '{{INDIKATOR}}'          => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator),
            '{{OPD_UTAMA}}'          => $opdUtama,
            '{{OPD_PENDUKUNG}}'      => $opdPendukung,
            '{{TAHUN}}'              => $tahun,
            '{{BASELINE}}'           => $fmt($indikator->baseline_2024),
            '{{TARGET}}'             => $fmt($target) . ($satuan && $target !== null ? " {$satuan}" : ''),
            '{{REALISASI}}'          => $fmt($capaian) . ($satuan && $capaian !== null ? " {$satuan}" : ''),
            '{{GAP}}'                => $fmt($gap) . ($satuan && $gap !== null ? " {$satuan}" : ''),
            '{{PERSENTASE_CAPAIAN}}' => $persen === null ? 'Belum tersedia' : $persen . '%',
            '{{ARAH_KINERJA}}'       => $arah,
            '{{STATUS}}'             => $statusTahunIni,
            '{{TREND}}'              => $tren,
            '{{RENCANA_AKSI}}'       => $rencanaAksi,
            '{{KEGIATAN}}'           => $kegiatan,
            '{{TARGET_OUTPUT}}'      => $targetOutput,
            '{{REALISASI_OUTPUT}}'   => $realisasiOutput,
            // NONAKTIF — {{REALISASI_ANGGARAN}} & {{STATUS_VALIDASI}}: data belum
            // tersedia di DB (lihat catatan di buildPrompt). Placeholder-nya juga
            // sudah dihapus dari template, jadi tidak dikirim ke AI.
            '{{KENDALA}}'            => trim((string) ($indikator->kendala ?? '')) ?: 'Belum tersedia',
            '{{SUMBER_DATA}}'        => trim((string) ($indikator->sumber_data ?? '')) ?: 'Belum tersedia',
        ];
    }
}
