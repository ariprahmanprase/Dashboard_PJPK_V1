<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indikators', function (Blueprint $table) {
            // Higher Better | Lower Better | Maintain / Stable | Proportional
            $table->renameColumn('arah', 'arah_target');
        });
    }

    public function down(): void
    {
        Schema::table('indikators', function (Blueprint $table) {
            $table->renameColumn('arah_target', 'arah');
        });
    }
};
