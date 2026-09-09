<?php

namespace App\Services;

use App\Models\Indikator;
use Illuminate\Support\Facades\Http;

/**
 * P8 — PSRI Policy Diagnosis (PRESSURE–STATE–RESPONSE–IMPACT).
 * Menganalisis kerangka kausal kebijakan: tekanan → kondisi → intervensi →
 * dampak, lalu menguji apakah respons pemerintah benar-benar menjawab
 * akar masalah (coherence test).
 */
class AiPsriService
{
    public function __construct(private AiPromptLibrary $promptLibrary)
    {
    }

    /**
     * Hasilkan analisis P8 untuk satu indikator pada satu tahun.
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
     * Susun user prompt P8 mengikuti template resmi PSRI.
     * Semua placeholder punya sumber data nyata — tidak ada yang dinonaktifkan.
     */
    private function buildPrompt(Indikator $indikator, string $tahun): string
    {
        $indikator->loadMissing(['pilar', 'opds']);

        $ganti = $this->petakan($indikator, $tahun);

        $template = <<<'PROMPT'
LAKUKAN ANALISIS PRESSURE–STATE–RESPONSE–IMPACT (PSRI)

Indikator: {{INDIKATOR}}
Data: {{DATA}}
Rencana Aksi: {{RENCANA_AKSI}}
Kegiatan: {{KEGIATAN}}
Hasil: {{HASIL}}

Susun:
PRESSURE - Apa tekanan atau penyebab utama?
STATE - Bagaimana kondisi aktual? Gunakan baseline, tren, target dan realisasi.
RESPONSE - Apa intervensi pemerintah yang telah dilakukan?
IMPACT - Apa perubahan outcome/impact yang dapat diamati?
COHERENCE TEST - Apakah RESPONSE benar-benar menjawab PRESSURE dan STATE?

Identifikasi bila:
- respons tidak menjawab akar masalah;
- output tinggi tetapi impact rendah;
- impact belum dapat dibuktikan.

FORMAT OUTPUT (naratif, TANPA tabel atau garis | ):

A. Analisis PSRI — lima sub-bagian berurutan; setiap sub-bagian berisi label:
   PRESSURE
   Temuan: <tekanan/penyebab utama>
   Evidence: <bukti dari data>
   Gap: <celah yang teridentifikasi, atau "tidak ada gap teridentifikasi">

   STATE
   Temuan: <kondisi aktual — baseline, tren, target, realisasi>
   Evidence: <angka dari data>
   Gap: <celah>

   RESPONSE
   Temuan: <intervensi yang telah dilakukan>
   Evidence: <kegiatan/renaksi dari data>
   Gap: <celah>

   IMPACT
   Temuan: <perubahan outcome yang dapat diamati>
   Evidence: <bukti>
   Gap: <celah — nyatakan bila impact belum dapat dibuktikan>

   COHERENCE TEST
   Temuan: <apakah response menjawab pressure & state — ya/sebagian/tidak + alasan>
   Evidence: <bukti>
   Gap: <celah koherensi — nyatakan bila output tinggi tetapi impact rendah,
        atau respons tidak menjawab akar masalah>

B. Penutup
   POLICY DIAGNOSIS: <diagnosis kebijakan dalam satu paragraf>
   PRIORITY RESPONSE: <respons prioritas yang paling dibutuhkan>

Catatan penggunaan: menganalisis Pressure-State-Response-Impact dan koherensi intervensi.
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

        // ── Arah kinerja ───────────────────────────────────────────────────
        $arahMentah = strtolower(trim((string) ($indikator->arah_target ?? '')));
        $arah = match (true) {
            str_contains($arahMentah, 'naik'), str_contains($arahMentah, 'tinggi'), str_contains($arahMentah, 'higher')
                => 'Semakin tinggi semakin baik (higher is better)',
            str_contains($arahMentah, 'turun'), str_contains($arahMentah, 'rendah'), str_contains($arahMentah, 'lower')
                => 'Semakin rendah semakin baik (lower is better)',
            default => 'Kontekstual / jaga stabilitas (arah tidak naik/turun tegas)',
        };

        // ── DATA: baseline + tren target/realisasi (bahan STATE) ───────────
        $riwayat = $indikator->targetCapaians()->orderBy('tahun')->get();
        $satuan  = trim((string) ($indikator->satuan ?? ''));

        $data = 'Baseline 2024: ' . $fmt($indikator->baseline_2024) . ($satuan ? " {$satuan}" : '')
            . ' | ' . ($riwayat->map(function ($t) use ($fmt) {
                $status = trim(($t->status_tl ?? '') . ' ' . ($t->warna_tl ?? '')) ?: '-';
                return "{$t->tahun}: target {$fmt($t->target)} → realisasi {$fmt($t->capaian)} ({$status})";
            })->implode('; ') ?: 'Belum tersedia');

        // ── Rencana aksi & kegiatan (bahan RESPONSE) ───────────────────────
        $renaksiProgram = \App\Models\RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->where(function ($q) use ($indikator) {
                foreach (['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'] as $col) {
                    $q->orWhere($col, $indikator->id);
                }
            })
            ->orderBy('no')
            ->get();

        $rencanaAksi = $renaksiProgram->map(fn ($r) => $r->rencana_aksi)
            ->filter()->implode('; ') ?: 'Belum tersedia';

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

        // ── HASIL: status tahun ini + perubahan antar tahun (bahan IMPACT) ──
        $tahunIni  = $riwayat->firstWhere('tahun', $tahun);
        $tahunLalu = $riwayat->filter(fn ($t) => $t->tahun < $tahun && $t->capaian !== null)->last();

        $statusIni = $tahunIni
            ? trim(($tahunIni->status_tl ?? '') . ' ' . ($tahunIni->warna_tl ?? '')) ?: 'Belum diisi'
            : 'Belum ada data';

        $perubahan = 'Belum dapat dihitung (realisasi tahun sebelumnya atau tahun ini belum ada)';
        if ($tahunIni?->capaian !== null && $tahunLalu?->capaian !== null
            && is_numeric($tahunIni->capaian) && is_numeric($tahunLalu->capaian)) {
            $delta = (float) $tahunIni->capaian - (float) $tahunLalu->capaian;
            $tanda = $delta > 0 ? '+' : '';
            $perubahan = "Perubahan {$tahunLalu->tahun} → {$tahun}: {$tanda}{$delta}"
                . ($satuan ? " {$satuan}" : '')
                . " (dari {$tahunLalu->capaian} menjadi {$tahunIni->capaian})";
        }

        $hasil = "Status tahun {$tahun}: {$statusIni}"
            . " | Target: {$fmt($tahunIni?->target)} | Realisasi: {$fmt($tahunIni?->capaian)}"
            . ($satuan && $tahunIni?->capaian !== null ? " {$satuan}" : '')
            . " | {$perubahan}";

        return [
            '{{INDIKATOR}}'    => trim(($indikator->kode ?? '') . ' — ' . $indikator->nama_indikator)
                . ' | Arah: ' . $arah
                . ' | OPD: ' . ($indikator->opds->pluck('nama_opd')->filter()->implode(', ') ?: '-'),
            '{{DATA}}'         => $data,
            '{{RENCANA_AKSI}}' => $rencanaAksi,
            '{{KEGIATAN}}'     => $kegiatan,
            '{{HASIL}}'        => $hasil,
        ];
    }
}
