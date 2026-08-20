<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminAnalisSeeder extends Seeder
{
    /**
     * Buat akun admin analis (idempotent).
     * Admin analis: melihat semua data + mengisi realisasi,
     * tanpa tambah/hapus renaksi dan tanpa kelola user.
     */
    private const PASSWORD_AWAL = 'pjpk2026';

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'analis@pjpk.sidoarjokab.go.id'],
            [
                'name' => 'Admin Analis',
                'password' => Hash::make(self::PASSWORD_AWAL),
                'role' => User::ROLE_ADMIN_ANALIS,
                'opd_id' => null,
            ]
        );

        $this->command->info('✅ Akun admin analis siap: analis@pjpk.sidoarjokab.go.id / ' . self::PASSWORD_AWAL);
    }
}
