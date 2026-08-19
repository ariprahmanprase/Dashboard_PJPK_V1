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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'admin_opd'])->default('admin_opd')->after('email');
            $table->unsignedTinyInteger('opd_id')->nullable()->after('role');
            $table->foreign('opd_id')->references('id')->on('opds')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['opd_id']);
            $table->dropColumn(['role', 'opd_id']);
        });
    }
};
