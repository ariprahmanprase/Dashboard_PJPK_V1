<?php

use Illuminate\Support\Facades\Route;

use App\Services\ExcelImportService;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/import', function (ExcelImportService $service) {
    $file = 'C:/xampp/htdocs/PJPK_V1_Dashboard/PJPK V1.xlsx';
    if (!file_exists($file)) {
        return response()->json(['error' => 'File not found: ' . $file], 404);
    }
    try {
        $result = $service->import($file);
        return response()->json(['success' => true, 'counts' => $result]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
    }
});
