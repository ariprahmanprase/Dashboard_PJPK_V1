<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            if (!Schema::hasColumn('renaksi_programs', 'dinas_text')) {
                $table->string('dinas_text')->nullable()->after('no');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('renaksi_programs', function (Blueprint $table) {
            if (Schema::hasColumn('renaksi_programs', 'dinas_text')) {
                $table->dropColumn('dinas_text');
            }
        });
    }
};
