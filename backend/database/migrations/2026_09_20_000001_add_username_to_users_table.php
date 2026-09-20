<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom username (unik, nullable agar kompatibel dengan data lama)
     * lalu isi otomatis dari bagian sebelum '@' pada email.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 60)->nullable()->unique()->after('name');
        });

        // Backfill: username = slug email lokal (sebelum '@'), unik dengan suffix angka
        foreach (DB::table('users')->orderBy('id')->get(['id', 'email']) as $u) {
            $base = preg_replace('/[^a-z0-9_.-]+/', '', strtolower(strtok($u->email, '@'))) ?: 'user';
            $username = $base;
            $i = 2;
            while (DB::table('users')->where('username', $username)->exists()) {
                $username = $base . $i++;
            }
            DB::table('users')->where('id', $u->id)->update(['username' => $username]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
