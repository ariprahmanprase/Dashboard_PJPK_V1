<?php

namespace Database\Seeders;

use App\Models\Opd;
use App\Models\RenaksiProgram;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Buat akun super admin + admin OPD (idempotent).
     * Password awal: lihat PASSWORD_AWAL — WAJIB diganti setelah login pertama.
     */
    private const PASSWORD_AWAL = 'pjpk2026';

    /**
     * Peta manual dinas_text => nama OPD di tabel opds, untuk nama
     * yang tidak bisa dicocokkan otomatis.
     */
    private const PETA_DINAS_OPD = [
        'Dinsos'  => 'Dinas Sosial',
        'Diskopum' => 'Dinkopum',
        'Disnaker' => 'Dinkopum (Bidang Penempatan Tenaga Kerja)',
        'Dinas Pangan dan Pertanian' => 'DKPP',
        'Dinas Perindustrian dan Perdagangan' => 'Disperindag',
    ];

    public function run(): void
    {
        // Super admin
        User::updateOrCreate(
            ['email' => 'admin@pjpk.sidoarjokab.go.id'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make(self::PASSWORD_AWAL),
                'role' => User::ROLE_SUPER_ADMIN,
                'opd_id' => null,
            ]
        );

        // Admin OPD: satu akun per dinas yang muncul di data renaksi
        $dinasList = RenaksiProgram::query()
            ->whereNotNull('dinas_text')
            ->whereNotIn('dinas_text', ['', '-'])
            ->distinct()
            ->pluck('dinas_text');

        $opdByName = Opd::all()->keyBy(fn($o) => strtoupper(trim($o->nama_opd)));

        $dibuat = 0;
        foreach ($dinasList as $dinas) {
            $slug = $this->slugify($dinas);
            $email = $slug . '@pjpk.sidoarjokab.go.id';

            $opdId = $this->matchOpd($dinas, $opdByName);

            // Fallback: ambil opd_id yang dipakai data renaksi dinas ini
            if ($opdId === null) {
                $opdId = RenaksiProgram::where('dinas_text', $dinas)
                    ->whereNotNull('opd_id')
                    ->value('opd_id');
            }

            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => 'Admin ' . $dinas,
                    'password' => Hash::make(self::PASSWORD_AWAL),
                    'role' => User::ROLE_ADMIN_OPD,
                    'opd_id' => $opdId,
                ]
            );
            $dibuat++;
        }

        $this->command->info("✅ Super admin + {$dibuat} akun admin OPD siap. Password awal: " . self::PASSWORD_AWAL);
    }

    private function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/', '', $text);
        return $text ?: 'opd';
    }

    private function matchOpd(string $dinas, $opdByName): ?int
    {
        // Peta manual dulu (nama singkatan yang tidak mirip teks)
        if (isset(self::PETA_DINAS_OPD[$dinas])) {
            $namaOpd = strtoupper(self::PETA_DINAS_OPD[$dinas]);
            if ($opdByName->has($namaOpd)) {
                return $opdByName[$namaOpd]->id;
            }
        }

        $dinasUpper = strtoupper(trim($dinas));

        if ($opdByName->has($dinasUpper)) {
            return $opdByName[$dinasUpper]->id;
        }

        // Partial match dua arah
        foreach ($opdByName as $nama => $opd) {
            if (str_contains($nama, $dinasUpper) || str_contains($dinasUpper, $nama)) {
                return $opd->id;
            }
        }

        return null;
    }
}
