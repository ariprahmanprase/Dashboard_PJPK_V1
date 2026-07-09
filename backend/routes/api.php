<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FilterController;
use Illuminate\Support\Facades\Route;

Route::get('/filters', FilterController::class);
Route::get('/dashboard/scorecards', [DashboardController::class, 'scorecards']);
Route::get('/dashboard/table', [DashboardController::class, 'table']);
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
