<?php

use App\Http\Controllers\Api\AdminAiIndikatorController;
use App\Http\Controllers\Api\AdminAiOpdController;
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
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/admin/renaksi-programs/satuan-options', [AdminRenaksiProgramController::class, 'satuanOptions']);
    Route::get('/admin/renaksi-programs/opd-options', [AdminRenaksiProgramController::class, 'opdOptions']);
    Route::get('/admin/renaksi-programs/indikator-options', [AdminRenaksiProgramController::class, 'indikatorOptions']);
    Route::get('/admin/renaksi-programs/import-template', [AdminRenaksiProgramController::class, 'importTemplate']);
    Route::post('/admin/renaksi-programs/import-preview', [AdminRenaksiProgramController::class, 'importPreview']);
    Route::post('/admin/renaksi-programs/import-store', [AdminRenaksiProgramController::class, 'importStore']);
    Route::get('/admin/renaksi-programs', [AdminRenaksiProgramController::class, 'index']);
    Route::post('/admin/renaksi-programs', [AdminRenaksiProgramController::class, 'store']);
    Route::put('/admin/renaksi-programs/{renaksiProgram}', [AdminRenaksiProgramController::class, 'update']);
    Route::delete('/admin/renaksi-programs/{renaksiProgram}', [AdminRenaksiProgramController::class, 'destroy']);
    Route::post('/admin/renaksi-programs/{renaksiProgram}/ai-recommendation', [AdminRenaksiProgramController::class, 'generateAiRecommendation']);
    Route::delete('/admin/renaksi-programs/{renaksiProgram}/ai-recommendation', [AdminRenaksiProgramController::class, 'deleteAiRecommendation']);

    // P1 — Analisis Kinerja Indikator (AI)
    Route::get('/admin/ai/indikator/options', [AdminAiIndikatorController::class, 'options']);
    Route::get('/admin/ai/indikator', [AdminAiIndikatorController::class, 'show']);
    Route::post('/admin/ai/indikator', [AdminAiIndikatorController::class, 'generate']);
    Route::delete('/admin/ai/indikator', [AdminAiIndikatorController::class, 'destroy']);

    // P2 — Analisis Portofolio OPD (AI)
    Route::get('/admin/ai/opd/options', [AdminAiOpdController::class, 'options']);
    Route::get('/admin/ai/opd', [AdminAiOpdController::class, 'show']);
    Route::post('/admin/ai/opd', [AdminAiOpdController::class, 'generate']);
    Route::delete('/admin/ai/opd', [AdminAiOpdController::class, 'destroy']);

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
Route::get('/dashboard/chart-per-indikator', [DashboardController::class, 'chartPerIndikator']);
Route::get('/dashboard/rencana-aksi-summary', [DashboardController::class, 'rencanaAksiSummary']);
Route::get('/dashboard/rencana-aksi-list', [DashboardController::class, 'rencanaAksiList']);
Route::get('/dashboard/renaksi-program-list', [DashboardController::class, 'renaksiProgramList']);
Route::get('/dashboard/renaksi-program-summary', [DashboardController::class, 'renaksiProgramSummary']);
Route::get('/dashboard/renaksi-program-dinas', [DashboardController::class, 'renaksiProgramDinas']);
Route::get('/dashboard/renaksi-program-indikators', [DashboardController::class, 'renaksiProgramIndikators']);
Route::get('/dashboard/rank-opd', [DashboardController::class, 'rankOpd']);
