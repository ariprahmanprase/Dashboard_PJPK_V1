<?php

/*
 |--------------------------------------------------------------------------
 | Buat akun admin_opd untuk seluruh OPD
 |--------------------------------------------------------------------------
 | Satu akun per OPD di tabel opds, role = admin_opd, terhubung via opd_id.
 |   email    = strtolower(kode_opd) . '@pjpk.sidoarjokab.go.id'
 |             (spasi di kode dihilangkan, mis. "Diskop UM" → diskopum)
 |   name     = 'Admin <nama_opd>'
 |   password = 'pjpk2026' (default — WAJIB diganti saat pertama login)
 |
 | Idempotent: email yang sudah ada di-skip. Jalankan:
 |   C:\xampp\php\php.exe buat_akun_opd.php
 */

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$domain   = '@pjpk.sidoarjokab.go.id';
$password = Hash::make('pjpk2026');
$now      = now();

$buat = 0; $skip = 0;
foreach (DB::table('opds')->orderBy('id')->get() as $opd) {
    $slug  = strtolower(preg_replace('/\s+/', '', $opd->kode_opd));
    $email = $slug . $domain;

    if (DB::table('users')->where('email', $email)->exists()) {
        echo "SKIP  $email (sudah ada)\n";
        $skip++;
        continue;
    }

    DB::table('users')->insert([
        'name'       => 'Admin ' . $opd->nama_opd,
        'email'      => $email,
        'role'       => 'admin_opd',
        'opd_id'     => $opd->id,
        'password'   => $password,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
    echo "BUAT  $email  →  {$opd->nama_opd}\n";
    $buat++;
}

echo "\nSelesai. Dibuat: $buat | dilewati: $skip | total admin_opd: "
    . DB::table('users')->where('role', 'admin_opd')->count() . "\n";
