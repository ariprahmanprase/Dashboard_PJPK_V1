<?php

use App\Http\Controllers\Api\AdminIndikatorController;
use App\Http\Controllers\Api\AdminRenaksiProgramController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FilterController;
use Illuminate\Support\Facades\Route;

// Auth (area /admin)
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/admin/renaksi-programs/satuan-options', [AdminRenaksiProgramController::class, 'satuanOptions']);
    Route::get('/admin/renaksi-programs/opd-options', [AdminRenaksiProgramController::class, 'opdOptions']);
    Route::get('/admin/renaksi-programs/indikator-options', [AdminRenaksiProgramController::class, 'indikatorOptions']);
    Route::get('/admin/renaksi-programs', [AdminRenaksiProgramController::class, 'index']);
    Route::post('/admin/renaksi-programs', [AdminRenaksiProgramController::class, 'store']);
    Route::put('/admin/renaksi-programs/{renaksiProgram}', [AdminRenaksiProgramController::class, 'update']);
    Route::delete('/admin/renaksi-programs/{renaksiProgram}', [AdminRenaksiProgramController::class, 'destroy']);

    // Pilar options — super admin & admin analis (untuk form edit di Admin Report)
    Route::get('/admin/indikators/pilar-options', [AdminIndikatorController::class, 'pilarOptions']);

    // Kelola user & indikator — khusus super admin
    Route::middleware('super_admin')->group(function () {
        Route::get('/admin/users/opd-options', [AdminUserController::class, 'opdOptions']);
        Route::apiResource('/admin/users', AdminUserController::class)->except(['show']);

        Route::put('/admin/indikators/{indikator}', [AdminIndikatorController::class, 'update'])
            ->where('indikator', '[A-Za-z0-9\-]+');
        Route::delete('/admin/indikators/{indikator}', [AdminIndikatorController::class, 'destroy'])
            ->where('indikator', '[A-Za-z0-9\-]+');
    });
});

Route::get('/filters', FilterController::class);
Route::get('/dashboard/scorecards', [DashboardController::class, 'scorecards']);
Route::get('/dashboard/table', [DashboardController::class, 'table']);
Route::get('/indikator/{kode}/detail', [DashboardController::class, 'indikatorDetail']);
Route::get('/indikator/{kode}/renaksi', [DashboardController::class, 'renaksi']);
Route::get('/dashboard/chart', [DashboardController::class, 'chart']);
Route::get('/dashboard/renaksi-pie', [DashboardController::class, 'renaksiPie']);
Route::get('/dashboard/renaksi-list', [DashboardController::class, 'renaksiList']);
Route::get('/dashboard/per-pilar', [DashboardController::class, 'perPilar']);
Route::get('/dashboard/per-opd', [DashboardController::class, 'perOpd']);
Route::get('/dashboard/heatmap', [DashboardController::class, 'heatmap']);
Route::get('/dashboard/chart-per-pilar', [DashboardController::class, 'chartPerPilar']);
Route::get('/dashboard/rencana-aksi-summary', [DashboardController::class, 'rencanaAksiSummary']);
Route::get('/dashboard/rencana-aksi-list', [DashboardController::class, 'rencanaAksiList']);
Route::get('/dashboard/renaksi-program-list', [DashboardController::class, 'renaksiProgramList']);
Route::get('/dashboard/renaksi-program-summary', [DashboardController::class, 'renaksiProgramSummary']);
Route::get('/dashboard/renaksi-program-dinas', [DashboardController::class, 'renaksiProgramDinas']);
Route::get('/dashboard/renaksi-program-indikators', [DashboardController::class, 'renaksiProgramIndikators']);
