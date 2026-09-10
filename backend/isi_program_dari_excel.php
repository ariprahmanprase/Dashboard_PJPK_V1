<?php

/*
 |--------------------------------------------------------------------------
 | Isi kolom kode_program & program di renaksi_programs
 |--------------------------------------------------------------------------
 | Sumber : "C:/Arip/STIESIA/Data PJPK/Data 09.09/Nama Program Renaksi.xlsx"
 |          sheet "AksiKegiatan OPD" — kolom B (PROGRAM) dicocokkan ke
 |          rencana_aksi via kolom C (RENCANA AKSI).
 |
 | Aturan:
 |  - PROGRAM "2.18.04 Program Pelayanan Penanaman Modal"
 |      → kode_program = "2.18.04", program = "Program Pelayanan Penanaman Modal"
 |  - PROGRAM tanpa kode (mis. "Program Perlindungan dan Jaminan Sosial")
 |      → kode_program = NULL, program = teks utuh
 |  - PROGRAM kosong di Excel → baris di-skip (tidak menimpa apapun)
 |
 | Pencocokan: teks rencana_aksi dinormalisasi (lowercase, hanya a-z0-9 spasi)
 | lalu dibandingkan persis. Sudah diuji: 285/285 match unik.
 |
 | Aman dijalankan berulang (idempotent). Jalankan:
 |   C:\xampp\php\php.exe isi_program_dari_excel.php
 */

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\DB;

$excelPath = 'C:/Arip/STIESIA/Data PJPK/Data 09.09/Nama Program Renaksi.xlsx';
$norm = fn($s) => trim(preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9 ]/u', ' ', mb_strtolower($s))));

// 1) Baca Excel → map rencana_aksi (normal) → [kode_program, program]
$sh = IOFactory::load($excelPath)->getSheet(0);
$map = [];
for ($r = 2; $r <= $sh->getHighestRow(); $r++) {
    $prog = trim((string) $sh->getCell([2, $r])->getFormattedValue());
    $ra   = trim((string) $sh->getCell([3, $r])->getFormattedValue());
    if ($ra === '' || $prog === '') continue;

    $kode = null; $nama = $prog;
    if (preg_match('/^(\d+\.\d+\.\d+)\s+(.+)$/', $prog, $m)) {
        $kode = $m[1];
        $nama = trim($m[2]);
    }
    $map[$norm($ra)] = [$kode, $nama];
}
echo "Baris Excel dengan program terisi: " . count($map) . "\n";

// 2) Update tiap renaksi yang cocok
$rows = DB::table('renaksi_programs')->select('id', 'rencana_aksi')->get();
$ok = 0; $skip = 0;
DB::transaction(function () use ($rows, $map, $norm, &$ok, &$skip) {
    foreach ($rows as $row) {
        $key = $norm($row->rencana_aksi);
        if (! isset($map[$key])) { $skip++; continue; }
        [$kode, $nama] = $map[$key];
        DB::table('renaksi_programs')->where('id', $row->id)
            ->update(['kode_program' => $kode, 'program' => $nama, 'updated_at' => now()]);
        $ok++;
    }
});

echo "Terupdate: $ok | tanpa padanan di Excel: $skip\n";
echo "Verifikasi — program terisi: " . DB::table('renaksi_programs')->whereNotNull('program')->where('program', '!=', '')->count() . "\n";
echo "Verifikasi — kode_program terisi: " . DB::table('renaksi_programs')->whereNotNull('kode_program')->where('kode_program', '!=', '')->count() . "\n";
