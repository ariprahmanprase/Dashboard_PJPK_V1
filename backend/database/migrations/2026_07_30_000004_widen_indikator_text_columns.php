<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indikators', function (Blueprint $table) {
            $table->text('dokrenda')->nullable()->change();
            $table->text('sumber_data')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('indikators', function (Blueprint $table) {
            $table->string('dokrenda', 255)->nullable()->change();
            $table->string('sumber_data', 255)->nullable()->change();
        });
    }
};
