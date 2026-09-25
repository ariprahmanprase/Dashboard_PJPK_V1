<?php

use App\Http\Controllers\Api\AdminAiCorrectiveActionController;
use App\Http\Controllers\Api\AdminAiCrossOpdController;
use App\Http\Controllers\Api\AdminAiCrossPillarController;
use App\Http\Controllers\Api\AdminAiDataGapController;
use App\Http\Controllers\Api\AdminAiEfektivitasController;
use App\Http\Controllers\Api\AdminAiExecutiveBriefController;
use App\Http\Controllers\Api\AdminAiIndikatorController;
use App\Http\Controllers\Api\AdminAiInnovationController;
use App\Http\Controllers\Api\AdminAiOpdController;
use App\Http\Controllers\Api\AdminAiPlanningBudgetController;
use App\Http\Controllers\Api\AdminAiPsriController;
use App\Http\Controllers\Api\AdminAiRedAlertController;
use App\Http\Controllers\Api\AdminAiRootCauseController;
use App\Http\Controllers\Api\AdminIndikatorController;
use App\Http\Controllers\Api\AdminOpdController;
use App\Http\Controllers\Api\AdminRenaksiProgramController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FilterController;
use Illuminate\Support\Facades\Route;

// Auth (area /admin) — throttle: maks 5 percobaan login per menit per IP
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/avatar', [AuthController::class, 'updateAvatar']);

    Route::get('/admin/renaksi-programs/satuan-options', [AdminRenaksiProgramController::class, 'satuanOptions']);
    Route::get('/admin/renaksi-programs/opd-options', [AdminRenaksiProgramController::class, 'opdOptions']);
    Route::get('/admin/renaksi-programs/indikator-options', [AdminRenaksiProgramController::class, 'indikatorOptions']);
    Route::get('/admin/renaksi-programs/import-template', [AdminRenaksiProgramController::class, 'importTemplate']);
    Route::get('/admin/renaksi-programs/export-pdf', [AdminRenaksiProgramController::class, 'exportPdf']);
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

    // P3 — Root Cause Analysis (AI)
    Route::get('/admin/ai/root-cause/options', [AdminAiRootCauseController::class, 'options']);
    Route::get('/admin/ai/root-cause', [AdminAiRootCauseController::class, 'show']);
    Route::post('/admin/ai/root-cause', [AdminAiRootCauseController::class, 'generate']);
    Route::delete('/admin/ai/root-cause', [AdminAiRootCauseController::class, 'destroy']);

    // P4 — Activity-Outcome Effectiveness (AI)
    Route::get('/admin/ai/efektivitas/options', [AdminAiEfektivitasController::class, 'options']);
    Route::get('/admin/ai/efektivitas', [AdminAiEfektivitasController::class, 'show']);
    Route::post('/admin/ai/efektivitas', [AdminAiEfektivitasController::class, 'generate']);
    Route::delete('/admin/ai/efektivitas', [AdminAiEfektivitasController::class, 'destroy']);

    // P5 — Corrective Action Generator (AI, chaining dari P1/P3/P4)
    Route::get('/admin/ai/corrective-action/options', [AdminAiCorrectiveActionController::class, 'options']);
    Route::get('/admin/ai/corrective-action', [AdminAiCorrectiveActionController::class, 'sumberTersedia']);
    Route::post('/admin/ai/corrective-action', [AdminAiCorrectiveActionController::class, 'generate']);
    Route::delete('/admin/ai/corrective-action', [AdminAiCorrectiveActionController::class, 'destroy']);

    // P6 — Red Indicator Alert (AI, hanya indikator berstatus merah)
    Route::get('/admin/ai/red-alert/tahun-options', [AdminAiRedAlertController::class, 'tahunOptions']);
    Route::get('/admin/ai/red-alert/options', [AdminAiRedAlertController::class, 'options']);
    Route::get('/admin/ai/red-alert', [AdminAiRedAlertController::class, 'show']);
    Route::post('/admin/ai/red-alert', [AdminAiRedAlertController::class, 'generate']);
    Route::delete('/admin/ai/red-alert', [AdminAiRedAlertController::class, 'destroy']);

    // P7 — Data Gap Analysis (AI, indikator dengan data belum memadai)
    Route::get('/admin/ai/data-gap/tahun-options', [AdminAiDataGapController::class, 'tahunOptions']);
    Route::get('/admin/ai/data-gap/options', [AdminAiDataGapController::class, 'options']);
    Route::get('/admin/ai/data-gap', [AdminAiDataGapController::class, 'show']);
    Route::post('/admin/ai/data-gap', [AdminAiDataGapController::class, 'generate']);
    Route::delete('/admin/ai/data-gap', [AdminAiDataGapController::class, 'destroy']);

    // P8 — PSRI Policy Diagnosis (AI)
    Route::get('/admin/ai/psri/options', [AdminAiPsriController::class, 'options']);
    Route::get('/admin/ai/psri', [AdminAiPsriController::class, 'show']);
    Route::post('/admin/ai/psri', [AdminAiPsriController::class, 'generate']);
    Route::delete('/admin/ai/psri', [AdminAiPsriController::class, 'destroy']);

    // P9 — Cross-OPD Coordination (AI, hanya indikator lintas sektor)
    Route::get('/admin/ai/cross-opd/options', [AdminAiCrossOpdController::class, 'options']);
    Route::get('/admin/ai/cross-opd', [AdminAiCrossOpdController::class, 'show']);
    Route::post('/admin/ai/cross-opd', [AdminAiCrossOpdController::class, 'generate']);
    Route::delete('/admin/ai/cross-opd', [AdminAiCrossOpdController::class, 'destroy']);

    // P10 — Executive Brief (AI, chaining dari hasil analisis per indikator)
    Route::get('/admin/ai/executive-brief/options', [AdminAiExecutiveBriefController::class, 'options']);
    Route::get('/admin/ai/executive-brief', [AdminAiExecutiveBriefController::class, 'sumberTersedia']);
    Route::post('/admin/ai/executive-brief', [AdminAiExecutiveBriefController::class, 'generate']);
    Route::delete('/admin/ai/executive-brief', [AdminAiExecutiveBriefController::class, 'destroy']);

    // P11 — Planning & Budget Alignment (AI). BELUM DITAMPILKAN DI UI —
    // endpoint sengaja tersedia tapi tanpa halaman/menu frontend sampai data
    // dokumen perencanaan & anggaran (RENSTRA/RKPD/RENJA/SUBKEGIATAN/ANGGARAN)
    // tersedia di DB. Lihat catatan di AiPlanningBudgetService.
    Route::get('/admin/ai/planning-budget/options', [AdminAiPlanningBudgetController::class, 'options']);
    Route::get('/admin/ai/planning-budget', [AdminAiPlanningBudgetController::class, 'show']);
    Route::post('/admin/ai/planning-budget', [AdminAiPlanningBudgetController::class, 'generate']);
    Route::delete('/admin/ai/planning-budget', [AdminAiPlanningBudgetController::class, 'destroy']);

    // P12 — Cross-Pillar Strategic Synthesis (AI, seluruh pilar sekaligus;
    // hanya role lintas dinas — admin OPD ditolak di controller)
    Route::get('/admin/ai/cross-pillar/options', [AdminAiCrossPillarController::class, 'options']);
    Route::get('/admin/ai/cross-pillar', [AdminAiCrossPillarController::class, 'show']);
    Route::post('/admin/ai/cross-pillar', [AdminAiCrossPillarController::class, 'generate']);
    Route::delete('/admin/ai/cross-pillar', [AdminAiCrossPillarController::class, 'destroy']);

    // P13 — Innovation Miner (AI, per renaksi/kegiatan)
    Route::get('/admin/ai/innovation/tahun-options', [AdminAiInnovationController::class, 'tahunOptions']);
    Route::get('/admin/ai/innovation/options', [AdminAiInnovationController::class, 'options']);
    Route::get('/admin/ai/innovation', [AdminAiInnovationController::class, 'show']);
    Route::post('/admin/ai/innovation', [AdminAiInnovationController::class, 'generate']);
    Route::delete('/admin/ai/innovation', [AdminAiInnovationController::class, 'destroy']);

    // Pilar options — super admin & admin analis (untuk form edit di Admin Report)
    Route::get('/admin/indikators/pilar-options', [AdminIndikatorController::class, 'pilarOptions']);

    // Edit indikator (nama, pilar, OPD, target & capaian) — super admin & admin analis
    Route::put('/admin/indikators/{indikator}', [AdminIndikatorController::class, 'update'])
        ->where('indikator', '[A-Za-z0-9\-]+')
        ->middleware('role:super_admin,admin_analis');

    // Kelola user & hapus indikator — khusus super admin
    Route::middleware('super_admin')->group(function () {
        Route::get('/admin/users/opd-options', [AdminUserController::class, 'opdOptions']);
        Route::apiResource('/admin/users', AdminUserController::class)->except(['show']);
        Route::apiResource('/admin/opds', AdminOpdController::class)->except(['show']);

        // Switch account (impersonate) — super admin masuk sebagai user lain
        Route::post('/admin/users/{user}/impersonate', [AuthController::class, 'impersonate']);

        Route::delete('/admin/indikators/{indikator}', [AdminIndikatorController::class, 'destroy'])
            ->where('indikator', '[A-Za-z0-9\-]+');
    });
});

Route::get('/filters', FilterController::class);
Route::get('/filters/opd', [FilterController::class, 'opds']);
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
