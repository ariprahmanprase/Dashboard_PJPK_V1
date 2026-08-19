<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->string('tahun', 4)->default('2025')->after('no')->index();
        });
    }

    public function down(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            $table->dropIndex(['tahun']);
            $table->dropColumn('tahun');
        });
    }
};
