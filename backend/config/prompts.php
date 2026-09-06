<?php

/**
 * ============================================================================
 * PROMPT LIBRARY — Struktur & Desain Monev PJPK Kabupaten Sidoarjo
 * ============================================================================
 *
 * Daftar seluruh prompt AI (P0–P13). Konten template diisi sesuai dokumen
 * "STRUKTUR DAN DESAIN MONEV PJPK - PROMPT LIBRARY" dari pimpinan.
 *
 * - 'P0' adalah MASTER SYSTEM PROMPT: dipakai sebagai system message untuk
 *   SEMUA prompt lain. Diisi lewat kunci 'master.template' di bawah.
 * - P1–P13 adalah prompt analisis; masing-masing akan punya template sendiri
 *   (ditambahkan bertahap sesuai ketersediaan data dashboard).
 *
 * CARA MENGISI TEMPLATE P0:
 *   Cukup tempel teks template ke dalam tanda kurung pada 'master' => 'template'.
 *   Kamu bisa memakai placeholder berikut yang otomatis diganti data nyata:
 *     {jumlah_indikator} {jumlah_opd} {jumlah_renaksi} {renaksi_kuantitatif}
 *     {renaksi_kualitatif} {tahun_aktif} {tanggal_hari_ini}
 *   Setelah mengubah file ini, jalankan:  php artisan config:clear
 * ============================================================================
 */

return [

    /*
    |--------------------------------------------------------------------------
    | P0 — MASTER SYSTEM PROMPT
    |--------------------------------------------------------------------------
    | Pengguna: Sistem. Mengendalikan perilaku AI & guardrail analisis.
    | TEMPEL TEMPLATE DARI PIMPINAN DI SINI (ganti seluruh isi 'template').
    */
    'master' => [
        'kode'     => 'P0',
        'nama'     => 'Master System Prompt',
        'pengguna' => 'Sistem',

        'template' => <<<'PROMPT'
ANDA ADALAH ANALIS SENIOR KEBIJAKAN PEMBANGUNAN DAERAH, MONITORING DAN EVALUASI
PETA JALAN PEMBANGUNAN KEPENDUDUKAN (PJPK) KABUPATEN SIDOARJO.

Tugas utama Anda adalah mengubah data PJPK menjadi diagnosis kebijakan, prioritas
tindakan, dan rekomendasi yang dapat dilaksanakan oleh perangkat daerah.

PRINSIP WAJIB:
1. Gunakan hanya data yang tersedia dalam input.
2. Jangan mengarang angka, penyebab, kegiatan, anggaran, program, atau fakta.
3. Bedakan secara eksplisit: fakta; interpretasi; dan dugaan yang masih memerlukan verifikasi.
4. Jika data tidak memadai, tulis: "Belum dapat disimpulkan berdasarkan data yang tersedia."
5. Jangan menyamakan aktivitas = output = outcome = impact.
6. Jangan menyimpulkan program efektif hanya karena kegiatan selesai atau anggaran terserap tinggi.
7. Analisis selalu hubungan: TARGET → REALISASI → GAP → TREND → KEGIATAN → OUTPUT → OUTCOME.
8. Perhatikan arah indikator: semakin tinggi semakin baik; semakin rendah semakin baik; atau indikator kontekstual.
9. Untuk indikator kuning atau merah, identifikasi akar masalah, risiko, tindakan korektif, PIC, tenggat, output dan bukti.
10. Untuk indikator hijau, tetap evaluasi keberlanjutan, kontribusi program, dan risiko pembalikan tren.
11. Untuk data kosong, jangan memberi status kinerja. Perlakukan sebagai data governance risk.
12. Identifikasi jenis masalah: data gap; implementation gap; effectiveness gap; coordination gap; planning gap; budget gap; policy/design gap; external factor.
13. Jangan merekomendasikan penambahan anggaran sebelum menilai efektivitas program yang sedang berjalan.
14. Jika membutuhkan OPD lain, jelaskan peran spesifik OPD tersebut.
15. Setiap rekomendasi harus memenuhi: ACTION + OWNER + DEADLINE + OUTPUT + EVIDENCE.
16. Gunakan bahasa teknokratis pemerintahan yang jelas dan ringkas.
17. Hindari rekomendasi generik seperti "meningkatkan koordinasi", "melakukan sosialisasi", "meningkatkan monitoring", atau "mengoptimalkan program", kecuali dijelaskan secara konkret siapa, apa, kapan, dan hasilnya.
18. Prioritaskan tindakan yang feasible dalam kewenangan pemerintah daerah.
19. Jika isu memerlukan keputusan pimpinan, tandai sebagai EXECUTIVE ESCALATION.
20. Akhiri analisis dengan keputusan atau tindakan yang paling penting.

KONTEKS DATA DASHBOARD (otomatis dari sistem):
- Jumlah indikator PJPK: {jumlah_indikator}
- Jumlah OPD: {jumlah_opd}
- Jumlah rencana aksi (renaksi) program: {jumlah_renaksi}
  ({renaksi_kuantitatif} kuantitatif, {renaksi_kualitatif} kualitatif)
- Tahun data aktif: {tahun_aktif}
- Tanggal hari ini: {tanggal_hari_ini}
PROMPT,
    ],

    /*
    |--------------------------------------------------------------------------
    | P1–P13 — PROMPT ANALISIS
    |--------------------------------------------------------------------------
    | Daftar lengkap sesuai dokumen. 'template' akan diisi saat prompt
    | bersangkutan diimplementasikan (bertahap sesuai ketersediaan data).
    | 'aktif' menandai prompt yang datanya sudah tersedia di dashboard.
    */
    'prompts' => [
        ['kode' => 'P1',  'nama' => 'Indicator Performance Analysis', 'pengguna' => 'PIC/OPD',          'fungsi' => 'Analisis satu indikator',                        'aktif' => true,  'template' => null],
        ['kode' => 'P2',  'nama' => 'OPD Portfolio Review',           'pengguna' => 'Kepala OPD',       'fungsi' => 'Analisis seluruh indikator satu OPD',            'aktif' => true,  'template' => null],
        ['kode' => 'P3',  'nama' => 'Root Cause Analysis',            'pengguna' => 'OPD/Bappeda',      'fungsi' => 'Menemukan akar masalah',                         'aktif' => true,  'template' => null],
        ['kode' => 'P4',  'nama' => 'Activity-Outcome Effectiveness', 'pengguna' => 'OPD/Bappeda',      'fungsi' => 'Menguji efektivitas kegiatan',                   'aktif' => true,  'template' => null],
        ['kode' => 'P5',  'nama' => 'Corrective Action Generator',    'pengguna' => 'OPD',              'fungsi' => 'Menyusun action tracker',                        'aktif' => true,  'template' => null],
        ['kode' => 'P6',  'nama' => 'Red Indicator Alert',            'pengguna' => 'Sekda/OPD',        'fungsi' => 'Analisis indikator merah',                       'aktif' => true,  'template' => null],
        ['kode' => 'P7',  'nama' => 'Data Gap Analysis',              'pengguna' => 'Data Owner',       'fungsi' => 'Menutup kekosongan dan kelemahan data',          'aktif' => true,  'template' => null],
        ['kode' => 'P8',  'nama' => 'PSRI Policy Diagnosis',          'pengguna' => 'Bappeda/DP3AKB',   'fungsi' => 'Pressure-State-Response-Impact',                 'aktif' => true,  'template' => null],
        ['kode' => 'P9',  'nama' => 'Cross-OPD Coordination',         'pengguna' => 'Sekda/Bappeda',    'fungsi' => 'Menentukan pembagian peran lintas OPD',          'aktif' => true,  'template' => null],
        ['kode' => 'P10', 'nama' => 'Executive Brief',                'pengguna' => 'Bupati/Sekda',     'fungsi' => 'Ringkasan keputusan',                            'aktif' => true,  'template' => null],
        ['kode' => 'P11', 'nama' => 'Planning & Budget Alignment',    'pengguna' => 'Bappeda',          'fungsi' => 'Menilai keterhubungan dokumen perencanaan',      'aktif' => false, 'template' => null],
        ['kode' => 'P12', 'nama' => 'Cross-Pillar Strategic Synthesis','pengguna' => 'Sekda/Bappeda',   'fungsi' => 'Sintesis lintas pilar',                          'aktif' => true,  'template' => null],
        ['kode' => 'P13', 'nama' => 'Innovation Miner',               'pengguna' => 'DP3AKB/Bappeda',   'fungsi' => 'Mengidentifikasi inovasi layak replikasi',       'aktif' => true,  'template' => null],
    ],
];
